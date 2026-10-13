import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
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
}

/** Offline check of pinned provenance, committed textures, and the full built visit. */
export async function checkAssets(root = repositoryRoot) {
  const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
  requireRecord(config && config.version === 1 && config.provider === 'Poly Haven'
    && Array.isArray(config.textures) && config.textures.length > 0,
    'assets.config.json needs a supported Poly Haven texture list');
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
  let textureBytes = 0;

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
    }
  }

  const actualPaths = new Set((await listFiles(sourceDirectory)).map(path => relative(sourceDirectory, path)));
  requireRecord(actualPaths.size === expectedPaths.size && [...actualPaths].every(path => expectedPaths.has(path)),
    'Committed Poly Haven files must match the pinned asset list exactly');

  const builtFiles = await listFiles(distDirectory);
  requireRecord(builtFiles.some(path => relative(distDirectory, path) === 'index.html'),
    'The built visit needs dist/index.html; run npm run build first');
  let visitBytes = 0;
  for (const path of builtFiles) visitBytes += (await stat(path)).size;
  requireRecord(visitBytes <= visitBudgetBytes,
    `Built visit is ${visitBytes} bytes, above the ${visitBudgetBytes}-byte budget`);
  return { textureCount: config.textures.length, mapCount: expectedPaths.size, textureBytes, visitBytes, visitBudgetBytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkAssets();
  console.log(`Verified ${result.mapCount} maps across ${result.textureCount} Poly Haven textures (${result.textureBytes} bytes).`);
  console.log(`Built visit: ${result.visitBytes} / ${result.visitBudgetBytes} bytes.`);
}
