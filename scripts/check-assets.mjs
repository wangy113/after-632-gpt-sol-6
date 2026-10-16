import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import sharp from 'sharp';
import { FloatType } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { lowSkyGenerator } from './generate-low-skies.mjs';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const firstViewBudgetBytes = 300_000;
const visitBudgetBytes = 15_000_000;
const mapSuffixes = { Diffuse: 'diff', nor_gl: 'nor_gl', arm: 'arm' };

function requireRecord(condition, message) {
  if (!condition) throw new Error(message);
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unexpected non-file asset: ${path}`);
  }
  return files;
}

async function verifyFile(path, map, label) {
  const bytes = await readFile(path);
  const md5 = createHash('md5').update(bytes).digest('hex');
  requireRecord(bytes.length === map.sizeBytes && md5 === map.md5,
    `${label}: expected ${map.sizeBytes} bytes / ${map.md5}, got ${bytes.length} bytes / ${md5}`);
  return bytes;
}

async function verifyLowFile(path, map, label) {
  const bytes = await readFile(path);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  requireRecord(bytes.length === map.sizeBytes && sha256 === map.sha256,
    `${label}: expected ${map.sizeBytes} bytes / ${map.sha256}, got ${bytes.length} bytes / ${sha256}`);
  const image = await sharp(bytes).metadata();
  requireRecord(image.format === 'webp' && image.width === 512 && image.height === 512,
    `${label}: expected a 512 × 512 WebP map`);
}

const hdrLoader = new HDRLoader().setDataType(FloatType);

function readSkyRadiance(bytes, width, height, label) {
  const parsed = hdrLoader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  requireRecord(parsed.width === width && parsed.height === height
    && parsed.data.length === width * height * 4,
  `${label}: expected a complete ${width} × ${height} RGBE sky`);
  let peakLuminance = 0;
  let brightPixels = 0;
  for (let pixel = 0; pixel < parsed.data.length; pixel += 4) {
    const luminance = 0.2126 * parsed.data[pixel]
      + 0.7152 * parsed.data[pixel + 1]
      + 0.0722 * parsed.data[pixel + 2];
    requireRecord(Number.isFinite(luminance) && luminance >= 0,
      `${label}: invalid HDR radiance`);
    peakLuminance = Math.max(peakLuminance, luminance);
    if (luminance > 10) brightPixels++;
  }
  return { peakLuminance, brightPixels };
}

async function verifyLowSkyFile(path, pin, sourcePeakLuminance, label) {
  const bytes = await readFile(path);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  requireRecord(bytes.length === pin.sizeBytes && sha256 === pin.sha256,
    `${label}: expected ${pin.sizeBytes} bytes / ${pin.sha256}, got ${bytes.length} bytes / ${sha256}`);
  const sky = readSkyRadiance(bytes, 512, 256, label);
  requireRecord(sky.brightPixels > 0 && sky.peakLuminance > 10
    && sky.peakLuminance > sourcePeakLuminance / 10,
  `${label}: Low sky lost HDR highlights`);
}

function tagAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function builtReferencePath(indexPath, reference, distDirectory) {
  const url = new URL(reference, pathToFileURL(indexPath));
  requireRecord(url.protocol === 'file:' && !url.host, `First-view reference must be local: ${reference}`);
  const path = fileURLToPath(url);
  const fromDist = relative(distDirectory, path);
  requireRecord(fromDist && fromDist !== '..' && !fromDist.startsWith(`..${sep}`) && !isAbsolute(fromDist),
    `First-view reference must stay inside dist: ${reference}`);
  return path;
}

/** Measure the built HTML, its referenced stylesheets, and its arrival still. */
export async function checkFirstView(distDirectory) {
  const indexPath = join(distDirectory, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const stylesheetRefs = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!tagAttribute(tag, 'rel')?.toLowerCase().split(/\s+/).includes('stylesheet')) continue;
    const href = tagAttribute(tag, 'href');
    requireRecord(href, 'Built stylesheet link needs an href');
    stylesheetRefs.push(href);
  }
  requireRecord(stylesheetRefs.length > 0, 'Built first view needs a stylesheet link');
  const arrivalImages = [...html.matchAll(/<img\b[^>]*>/gi)]
    .filter(([tag]) => tagAttribute(tag, 'id') === 'arrival-still');
  requireRecord(arrivalImages.length === 1, 'Built first view needs exactly one arrival still');
  const [arrivalTag] = arrivalImages[0];
  requireRecord(!tagAttribute(arrivalTag, 'srcset'), 'Arrival srcset needs first-view budget handling');
  const beforeArrival = html.slice(0, arrivalImages[0].index).toLowerCase();
  requireRecord(beforeArrival.lastIndexOf('<picture') <= beforeArrival.lastIndexOf('</picture'),
    'Arrival picture sources need first-view budget handling');
  const stillRef = tagAttribute(arrivalTag, 'src');
  requireRecord(stillRef, 'Built arrival still needs a src');

  const files = new Set([indexPath]);
  for (const reference of stylesheetRefs) {
    const path = builtReferencePath(indexPath, reference, distDirectory);
    requireRecord(extname(path) === '.css', `Built stylesheet must be CSS: ${reference}`);
    const css = await readFile(path, 'utf8');
    requireRecord(!/@import\b|url\s*\(/i.test(css),
      `Linked stylesheet has further asset references to budget: ${reference}`);
    files.add(path);
  }
  const stillPath = builtReferencePath(indexPath, stillRef, distDirectory);
  requireRecord(extname(stillPath) === '.webp', `Built arrival still must be WebP: ${stillRef}`);
  files.add(stillPath);

  let firstViewBytes = 0;
  for (const path of files) {
    const file = await stat(path);
    requireRecord(file.isFile(), `First-view reference is not a file: ${path}`);
    firstViewBytes += file.size;
  }
  requireRecord(firstViewBytes <= firstViewBudgetBytes,
    `Built first view is ${firstViewBytes} bytes, above the ${firstViewBudgetBytes}-byte budget`);
  return { firstViewBytes, firstViewBudgetBytes };
}

/** Offline check of pinned provenance, committed textures, and the full built visit. */
export async function checkAssets(root = repositoryRoot) {
  const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  requireRecord(packageJson.dependencies?.three === lowSkyGenerator.version,
    'Low sky generation needs the pinned Three.js version');
  requireRecord(config && config.version === 1 && config.provider === 'Poly Haven'
    && Array.isArray(config.textures) && config.textures.length > 0
    && Array.isArray(config.skies) && config.skies.length > 0,
    'assets.config.json needs supported Poly Haven texture and sky lists');
  requireRecord(config.license?.id === 'CC0-1.0' && config.license.url === 'https://polyhaven.com/license',
    'Poly Haven assets need the recorded CC0 license and source URL');
  requireRecord(/^\d{4}-\d{2}-\d{2}$/.test(config.verifiedOn)
    && !Number.isNaN(Date.parse(`${config.verifiedOn}T00:00:00Z`))
    && new Date(`${config.verifiedOn}T00:00:00Z`).toISOString().slice(0, 10) === config.verifiedOn,
  'Asset provenance needs a valid verification date');

  const sourceDirectory = join(root, 'public/assets/polyhaven');
  const distDirectory = join(root, 'dist');
  const expectedPaths = new Set();
  const seenIds = new Set();
  const seenRoles = new Set();
  const seenSkyIds = new Set();
  let textureBytes = 0;
  let lowTextureBytes = 0;
  let skyBytes = 0;
  let lowSkyBytes = 0;
  let mapCount = 0;
  let lowMapCount = 0;

  for (const texture of config.textures) {
    requireRecord(texture && typeof texture.id === 'string' && /^[a-z0-9_]+$/.test(texture.id)
      && typeof texture.role === 'string' && /^[a-z0-9-]+$/.test(texture.role)
      && !seenIds.has(texture.id) && !seenRoles.has(texture.role),
    `Invalid or repeated texture id/role: ${texture?.id}`);
    seenIds.add(texture.id);
    seenRoles.add(texture.role);
    requireRecord(texture.status === 'candidate' || texture.status === 'approved',
      `${texture.id}: texture status must be candidate or approved`);
    requireRecord(texture.sourceUrl === `https://polyhaven.com/a/${texture.id}`
      && texture.filesApiUrl === `https://api.polyhaven.com/files/${texture.id}`,
    `${texture.id}: Poly Haven source records are missing or mismatched`);
    requireRecord(texture.resolution === '1k' && texture.format === 'jpg',
      `${texture.id}: unsupported texture resolution or format`);
    requireRecord(texture.maps && Object.keys(texture.maps).sort().join(',') === Object.keys(mapSuffixes).sort().join(','),
      `${texture.id}: expected Diffuse, nor_gl, and arm maps`);
    const low = texture.low;
    requireRecord(low?.resolution === '512'
      && low.sourceResolution === texture.resolution
      && low.generator?.tool === 'sharp' && low.generator.version === sharp.versions.sharp
      && low.generator.kernel === 'lanczos3' && low.generator.fastShrinkOnLoad === false
      && low.generator.diffuse?.format === 'webp'
      && low.generator.diffuse.quality === 90 && low.generator.diffuse.effort === 4
      && low.generator.diffuse.smartSubsample === true
      && low.generator.data?.format === 'webp'
      && low.generator.data.lossless === true && low.generator.data.effort === 4
      && low.maps && Object.keys(low.maps).sort().join(',') === Object.keys(mapSuffixes).sort().join(','),
    `${texture.id}: Low maps need the pinned 512-pixel Sharp recipe`);

    for (const [kind, suffix] of Object.entries(mapSuffixes)) {
      const map = texture.maps[kind];
      const filename = `${texture.id}_${suffix}_1k.jpg`;
      requireRecord(map && map.url === `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${texture.id}/${filename}`
        && Number.isSafeInteger(map.sizeBytes) && map.sizeBytes > 0
        && typeof map.md5 === 'string' && /^[a-f0-9]{32}$/.test(map.md5),
      `${texture.id}/${kind}: invalid pinned URL, size, or MD5`);
      const path = join(texture.id, filename);
      expectedPaths.add(path);
      await verifyFile(join(sourceDirectory, path), map, `Committed ${texture.id}/${kind}`);
      await verifyFile(join(distDirectory, 'assets/polyhaven', path), map, `Built ${texture.id}/${kind}`);
      textureBytes += map.sizeBytes;
      mapCount++;

      const lowMap = low.maps[kind];
      const lowFilename = `${texture.id}_${suffix}_512.webp`;
      requireRecord(lowMap && lowMap.file === lowFilename
        && Number.isSafeInteger(lowMap.sizeBytes) && lowMap.sizeBytes > 0
        && typeof lowMap.sha256 === 'string' && /^[a-f0-9]{64}$/.test(lowMap.sha256),
      `${texture.id}/${kind}: invalid pinned Low file, size, or SHA-256`);
      const lowPath = join(texture.id, lowFilename);
      expectedPaths.add(lowPath);
      await verifyLowFile(join(sourceDirectory, lowPath), lowMap, `Committed Low ${texture.id}/${kind}`);
      await verifyLowFile(join(distDirectory, 'assets/polyhaven', lowPath), lowMap, `Built Low ${texture.id}/${kind}`);
      lowTextureBytes += lowMap.sizeBytes;
      lowMapCount++;
    }
  }

  for (const sky of config.skies) {
    requireRecord(sky && typeof sky.id === 'string' && /^[a-z0-9_]+$/.test(sky.id)
      && !seenSkyIds.has(sky.id),
    `Invalid or repeated sky id: ${sky?.id}`);
    seenSkyIds.add(sky.id);
    requireRecord(sky.status === 'candidate' || sky.status === 'approved',
      `${sky.id}: sky status must be candidate or approved`);
    requireRecord(sky.sourceUrl === `https://polyhaven.com/a/${sky.id}`
      && sky.filesApiUrl === `https://api.polyhaven.com/files/${sky.id}`,
    `${sky.id}: Poly Haven source records are missing or mismatched`);
    requireRecord(sky.resolution === '1k' && sky.format === 'hdr',
      `${sky.id}: unsupported sky resolution or format`);
    const filename = `${sky.id}_1k.hdr`;
    const file = sky.file;
    requireRecord(file && file.url === `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${filename}`
      && Number.isSafeInteger(file.sizeBytes) && file.sizeBytes > 0
      && typeof file.md5 === 'string' && /^[a-f0-9]{32}$/.test(file.md5),
    `${sky.id}: invalid pinned sky URL, size, or MD5`);
    const path = join('sky', filename);
    expectedPaths.add(path);
    const sourceBytes = await verifyFile(join(sourceDirectory, path), file, `Committed sky/${sky.id}`);
    await verifyFile(join(distDirectory, 'assets/polyhaven', path), file, `Built sky/${sky.id}`);
    const sourcePeakLuminance = readSkyRadiance(sourceBytes, 1024, 512,
      `Committed sky/${sky.id}`).peakLuminance;
    skyBytes += file.sizeBytes;

    const low = sky.low;
    requireRecord(low?.resolution === '512' && low.sourceResolution === sky.resolution
      && isDeepStrictEqual(low.generator, lowSkyGenerator),
    `${sky.id}: Low sky needs the pinned 512 × 256 HDR recipe`);
    const lowFilename = `${sky.id}_512.hdr`;
    requireRecord(low.file?.file === lowFilename
      && Number.isSafeInteger(low.file.sizeBytes) && low.file.sizeBytes > 0
      && typeof low.file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(low.file.sha256),
    `${sky.id}: invalid pinned Low sky file, size, or SHA-256`);
    const lowPath = join('sky', lowFilename);
    expectedPaths.add(lowPath);
    await verifyLowSkyFile(join(sourceDirectory, lowPath), low.file, sourcePeakLuminance,
      `Committed Low sky/${sky.id}`);
    await verifyLowSkyFile(join(distDirectory, 'assets/polyhaven', lowPath), low.file, sourcePeakLuminance,
      `Built Low sky/${sky.id}`);
    lowSkyBytes += low.file.sizeBytes;
  }

  const actualPaths = new Set((await listFiles(sourceDirectory)).map(path => relative(sourceDirectory, path)));
  requireRecord(actualPaths.size === expectedPaths.size && [...actualPaths].every(path => expectedPaths.has(path)),
    'Committed Poly Haven files must match the pinned asset list exactly');
  const builtAssetDirectory = join(distDirectory, 'assets/polyhaven');
  const builtPaths = new Set((await listFiles(builtAssetDirectory)).map(path => relative(builtAssetDirectory, path)));
  requireRecord(builtPaths.size === expectedPaths.size && [...builtPaths].every(path => expectedPaths.has(path)),
    'Built Poly Haven files must match the pinned asset list exactly');

  const builtFiles = await listFiles(distDirectory);
  requireRecord(builtFiles.some(path => relative(distDirectory, path) === 'index.html'),
    'The built visit needs dist/index.html; run npm run build first');
  const firstView = await checkFirstView(distDirectory);
  let visitBytes = 0;
  for (const path of builtFiles) visitBytes += (await stat(path)).size;
  requireRecord(visitBytes <= visitBudgetBytes,
    `Built visit is ${visitBytes} bytes, above the ${visitBudgetBytes}-byte budget`);
  return { textureCount: config.textures.length, mapCount, textureBytes, lowMapCount, lowTextureBytes, ...firstView,
    skyCount: config.skies.length, skyBytes, lowSkyCount: config.skies.length, lowSkyBytes,
    visitBytes, visitBudgetBytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkAssets();
  console.log(`Verified ${result.mapCount} maps across ${result.textureCount} Poly Haven textures (${result.textureBytes} bytes).`);
  console.log(`Verified ${result.lowMapCount} derived Low maps (${result.lowTextureBytes} bytes).`);
  console.log(`Verified ${result.skyCount} Poly Haven skies (${result.skyBytes} bytes).`);
  console.log(`Verified ${result.lowSkyCount} derived Low skies (${result.lowSkyBytes} bytes).`);
  console.log(`Built first view (HTML, CSS, arrival still): ${result.firstViewBytes} / ${result.firstViewBudgetBytes} bytes.`);
  console.log(`Built visit: ${result.visitBytes} / ${result.visitBudgetBytes} bytes.`);
}
