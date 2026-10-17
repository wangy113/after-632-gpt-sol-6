import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FloatType } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceDirectory = join(root, 'public/assets/polyhaven/sky');
const outputPath = join(root, 'src/render/skyAnalysis.json');
const luminance = [0.2126, 0.7152, 0.0722];

/**
 * Locate the sun in a top-to-bottom linear RGB HDR raster. The HDRLoader sets
 * flipY=true, so file row zero maps to v=1 in Three's equirectangular texture.
 * The returned direction points from the room toward the sun before any scene
 * background rotation. Its color is linear RGB with unit luminance; intensity
 * remains an independent artistic/photometric calibration.
 */
export function analyzeSkyPixels({ data, width, height }) {
  assert.ok(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0,
    'Sky dimensions must be positive integers');
  assert.equal(data.length, width * height * 4, 'Sky must have RGBA pixels');

  let maximum = -Infinity;
  let peakX = -1;
  let peakY = -1;
  let peakColor = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const color = [data[offset], data[offset + 1], data[offset + 2]];
      assert.ok(color.every(channel => Number.isFinite(channel) && channel >= 0),
        'Sky RGB must be finite and nonnegative');
      const brightness = color.reduce((sum, channel, index) => sum + channel * luminance[index], 0);
      if (brightness > maximum) {
        maximum = brightness;
        peakX = x;
        peakY = y;
        peakColor = color;
      }
    }
  }
  // Pure-sky candidates have a narrow solar peak many orders of magnitude
  // above the ambient sky. Reject a flat or dark raster instead of inferring a
  // spurious sun from the first or brightest ordinary sky pixel.
  assert.ok(maximum > 10, 'Sky has no bright sun peak');

  const u = (peakX + 0.5) / width;
  const v = 1 - (peakY + 0.5) / height;
  const theta = (u - 0.5) * 2 * Math.PI;
  const phi = (v - 0.5) * Math.PI;
  const cosPhi = Math.cos(phi);
  const direction = [cosPhi * Math.cos(theta), Math.sin(phi), cosPhi * Math.sin(theta)];
  const color = peakColor.map(channel => channel / maximum);
  return { direction, color, peak: [peakX, peakY] };
}

function verifySource(bytes, sky) {
  const filename = `${sky.id}_1k.hdr`;
  assert.match(sky.id, /^[a-z0-9_]+$/, 'Unsafe sky ID');
  assert.equal(sky.resolution, '1k', `${sky.id}: source resolution changed`);
  assert.equal(sky.format, 'hdr', `${sky.id}: source format changed`);
  assert.equal(sky.file.url,
    `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${filename}`,
    `${sky.id}: source URL changed`);
  assert.equal(bytes.length, sky.file.sizeBytes, `${sky.id}: source byte count changed`);
  assert.equal(createHash('md5').update(bytes).digest('hex'), sky.file.md5,
    `${sky.id}: source MD5 changed`);
}

export async function generateSkyAnalysis() {
  const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
  assert.equal(config.version, 1, 'Unsupported asset manifest version');
  assert.ok(Array.isArray(config.skies) && config.skies.length > 0,
    'Asset manifest has no sky candidates');
  const loader = new HDRLoader().setDataType(FloatType);
  const skies = {};
  for (const sky of config.skies) {
    assert.match(sky.id, /^[a-z0-9_]+$/, 'Unsafe sky ID');
    assert.ok(!Object.hasOwn(skies, sky.id), `Duplicate sky ID: ${sky.id}`);
    const bytes = await readFile(join(sourceDirectory, `${sky.id}_1k.hdr`));
    verifySource(bytes, sky);
    const parsed = loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    assert.equal(parsed.width, 1024, `${sky.id}: source width changed`);
    assert.equal(parsed.height, 512, `${sky.id}: source height changed`);
    skies[sky.id] = analyzeSkyPixels(parsed);
  }
  return `${JSON.stringify({ version: 1, skies }, null, 2)}\n`;
}

async function main() {
  const check = process.argv.length === 3 && process.argv[2] === '--check';
  assert.ok(check || process.argv.length === 2,
    'Usage: node scripts/analyze-sky.mjs [--check]');
  const generated = await generateSkyAnalysis();
  if (check) {
    assert.equal(await readFile(outputPath, 'utf8'), generated,
      'Sky analysis differs from the pinned HDR sources; regenerate it');
    console.log('Verified sky analysis against all pinned 1k HDR sources.');
  } else {
    await writeFile(outputPath, generated);
    console.log(`Wrote ${outputPath}.`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
