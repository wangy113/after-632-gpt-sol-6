import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
const assetDirectory = join(root, 'public/assets/polyhaven');
const suffixes = { Diffuse: 'diff', nor_gl: 'nor_gl', arm: 'arm' };
const generator = {
  tool: 'sharp',
  version: '0.35.5',
  kernel: 'lanczos3',
  fastShrinkOnLoad: false,
  diffuse: { format: 'webp', quality: 90, effort: 4, smartSubsample: true },
  data: { format: 'webp', lossless: true, effort: 4 },
};

function verify(bytes, pin, algorithm, label) {
  const digest = createHash(algorithm).update(bytes).digest('hex');
  const expected = algorithm === 'md5' ? pin.md5 : pin.sha256;
  assert.equal(bytes.length, pin.sizeBytes, `${label}: byte count differs from the pinned value`);
  assert.equal(digest, expected, `${label}: ${algorithm} differs from the pinned value`);
}

async function readExisting(path) {
  try {
    return await readFile(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

assert.equal(config.version, 1, 'Unsupported asset manifest version');
assert.equal(config.provider, 'Poly Haven', 'Unexpected source provider');
assert.equal(sharp.versions.sharp, generator.version, 'Use the pinned Sharp version');

let generated = 0;
let reused = 0;
let totalBytes = 0;
for (const texture of config.textures) {
  assert.match(texture.id, /^[a-z0-9_]+$/, 'Unsafe texture ID');
  assert.equal(texture.resolution, '1k', `${texture.id}: expected a pinned 1k source`);
  assert.equal(texture.format, 'jpg', `${texture.id}: expected JPG source maps`);
  assert.equal(texture.low?.resolution, '512', `${texture.id}: Low must be 512 pixels`);
  assert.equal(texture.low?.sourceResolution, '1k', `${texture.id}: Low must derive from 1k`);
  assert.deepEqual(texture.low.generator, generator, `${texture.id}: Low generator recipe changed`);
  assert.deepEqual(Object.keys(texture.maps).sort(), Object.keys(suffixes).sort(),
    `${texture.id}: expected exactly three pinned source maps`);
  assert.deepEqual(Object.keys(texture.low.maps).sort(), Object.keys(suffixes).sort(),
    `${texture.id}: expected exactly three Low maps`);

  for (const [kind, suffix] of Object.entries(suffixes)) {
    const sourceName = `${texture.id}_${suffix}_1k.jpg`;
    const sourcePin = texture.maps[kind];
    assert.equal(sourcePin.url,
      `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${texture.id}/${sourceName}`,
      `${texture.id}/${kind}: source URL changed`);
    const sourceBytes = await readFile(join(assetDirectory, texture.id, sourceName));
    verify(sourceBytes, sourcePin, 'md5', `${texture.id}/${kind} source`);
    const sourceMetadata = await sharp(sourceBytes).metadata();
    assert.equal(sourceMetadata.format, 'jpeg', `${texture.id}/${kind}: source is not JPEG`);
    assert.equal(sourceMetadata.width, 1024, `${texture.id}/${kind}: source width changed`);
    assert.equal(sourceMetadata.height, 1024, `${texture.id}/${kind}: source height changed`);

    const options = kind === 'Diffuse' ? generator.diffuse : generator.data;
    const output = await sharp(sourceBytes)
      .resize(512, 512, { kernel: generator.kernel, fastShrinkOnLoad: generator.fastShrinkOnLoad })
      .webp(options)
      .toBuffer();
    const outputPin = texture.low.maps[kind];
    const expectedName = `${texture.id}_${suffix}_512.webp`;
    assert.equal(outputPin.file, expectedName, `${texture.id}/${kind}: Low filename changed`);
    verify(output, outputPin, 'sha256', `${texture.id}/${kind} generated Low`);
    const outputMetadata = await sharp(output).metadata();
    assert.equal(outputMetadata.format, 'webp', `${texture.id}/${kind}: Low is not WebP`);
    assert.equal(outputMetadata.width, 512, `${texture.id}/${kind}: Low width changed`);
    assert.equal(outputMetadata.height, 512, `${texture.id}/${kind}: Low height changed`);

    const target = join(assetDirectory, texture.id, expectedName);
    const existing = await readExisting(target);
    if (existing) {
      verify(existing, outputPin, 'sha256', `${texture.id}/${kind} committed Low`);
      assert.ok(existing.equals(output), `${texture.id}/${kind}: committed and generated Low differ`);
      reused++;
    } else {
      await writeFile(target, output, { flag: 'wx' });
      generated++;
    }
    totalBytes += output.length;
    console.log(`${texture.id}/${kind}: ${output.length} bytes, ${outputPin.sha256}`);
  }
}

console.log(`Verified ${generated + reused} pinned 512-pixel maps (${totalBytes} bytes): ${generated} generated, ${reused} reused.`);
