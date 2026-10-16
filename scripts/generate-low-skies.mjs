import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FloatType } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const skyDirectory = join(root, 'public/assets/polyhaven/sky');
const sourceWidth = 1024;
const sourceHeight = 512;
const lowWidth = 512;
const lowHeight = 256;

export const lowSkyGenerator = {
  tool: 'three/HDRLoader',
  version: '0.186.1',
  sourceType: 'Float32',
  downsample: 'linear-rgb-2x2-box',
  encoding: 'radiance-rgbe-scanline-rle',
  quantization: 'ceil-log2-max-round-nearest-255',
};

const loader = new HDRLoader().setDataType(FloatType);

function verify(bytes, pin, algorithm, label) {
  const digest = createHash(algorithm).update(bytes).digest('hex');
  const expected = algorithm === 'md5' ? pin.md5 : pin.sha256;
  assert.equal(bytes.length, pin.sizeBytes, `${label}: byte count differs from the pinned value`);
  assert.equal(digest, expected, `${label}: ${algorithm} differs from the pinned value`);
}

function encodePixel(red, green, blue, target, offset) {
  const maximum = Math.max(red, green, blue);
  assert.ok(Number.isFinite(maximum) && red >= 0 && green >= 0 && blue >= 0,
    'Sky radiance must be finite and nonnegative');
  if (maximum === 0) {
    target.fill(0, offset, offset + 4);
    return;
  }
  const exponent = Math.ceil(Math.log2(maximum)) + 128;
  assert.ok(exponent > 0 && exponent <= 255, 'Sky radiance is outside RGBE range');
  const multiplier = 255 / Math.pow(2, exponent - 128);
  target[offset] = Math.min(255, Math.round(red * multiplier));
  target[offset + 1] = Math.min(255, Math.round(green * multiplier));
  target[offset + 2] = Math.min(255, Math.round(blue * multiplier));
  target[offset + 3] = exponent;
}

function appendRleChannel(bytes, channel) {
  let position = 0;
  while (position < channel.length) {
    let run = 1;
    while (run < 127 && position + run < channel.length
      && channel[position + run] === channel[position]) run++;
    if (run >= 4) {
      bytes.push(128 + run, channel[position]);
      position += run;
      continue;
    }

    const literalStart = position;
    position += run;
    while (position - literalStart < 128 && position < channel.length) {
      run = 1;
      while (run < 127 && position + run < channel.length
        && channel[position + run] === channel[position]) run++;
      if (run >= 4 || position - literalStart + run > 128) break;
      position += run;
    }
    bytes.push(position - literalStart);
    for (let index = literalStart; index < position; index++) bytes.push(channel[index]);
  }
}

/** Downsample linear HDR radiance and encode modern Radiance RGBE scanlines. */
export function generateLowSky(sourceBytes) {
  const source = loader.parse(sourceBytes.buffer.slice(
    sourceBytes.byteOffset, sourceBytes.byteOffset + sourceBytes.byteLength));
  assert.equal(source.width, sourceWidth, 'Sky source width changed');
  assert.equal(source.height, sourceHeight, 'Sky source height changed');
  assert.equal(source.data.length, sourceWidth * sourceHeight * 4, 'Sky source pixels are incomplete');

  const output = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${lowHeight} +X ${lowWidth}\n`, 'ascii')];
  const pixels = new Uint8Array(lowWidth * 4);
  const encoded = [];
  const channel = new Uint8Array(lowWidth);
  for (let y = 0; y < lowHeight; y++) {
    for (let x = 0; x < lowWidth; x++) {
      const first = (2 * y * sourceWidth + 2 * x) * 4;
      const second = first + sourceWidth * 4;
      const rgb = [0, 1, 2].map(component => (
        source.data[first + component] + source.data[first + 4 + component]
        + source.data[second + component] + source.data[second + 4 + component]
      ) / 4);
      encodePixel(rgb[0], rgb[1], rgb[2], pixels, x * 4);
    }
    encoded.length = 0;
    encoded.push(2, 2, lowWidth >> 8, lowWidth & 255);
    for (let component = 0; component < 4; component++) {
      for (let x = 0; x < lowWidth; x++) channel[x] = pixels[x * 4 + component];
      appendRleChannel(encoded, channel);
    }
    output.push(Buffer.from(encoded));
  }
  const bytes = Buffer.concat(output);
  const decoded = loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  assert.equal(decoded.width, lowWidth, 'Generated Low sky width changed');
  assert.equal(decoded.height, lowHeight, 'Generated Low sky height changed');
  assert.equal(decoded.data.length, lowWidth * lowHeight * 4, 'Generated Low sky pixels are incomplete');
  return bytes;
}

async function readExisting(path) {
  try {
    return await readFile(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const inspect = process.argv.length === 3 && process.argv[2] === '--inspect';
  assert.ok(inspect || process.argv.length === 2, 'Usage: node scripts/generate-low-skies.mjs [--inspect]');
  const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.dependencies.three, lowSkyGenerator.version, 'Use the pinned Three.js version');
  assert.equal(config.version, 1, 'Unsupported asset manifest version');
  assert.equal(config.provider, 'Poly Haven', 'Unexpected source provider');

  let generated = 0;
  let reused = 0;
  let totalBytes = 0;
  for (const sky of config.skies) {
    assert.match(sky.id, /^[a-z0-9_]+$/, 'Unsafe sky ID');
    assert.equal(sky.resolution, '1k', `${sky.id}: expected a pinned 1k source`);
    assert.equal(sky.format, 'hdr', `${sky.id}: expected an HDR source`);
    const sourceName = `${sky.id}_1k.hdr`;
    assert.equal(sky.file.url,
      `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/${sourceName}`,
      `${sky.id}: source URL changed`);
    const sourceBytes = await readFile(join(skyDirectory, sourceName));
    verify(sourceBytes, sky.file, 'md5', `${sky.id} source`);
    const bytes = generateLowSky(sourceBytes);
    const filename = `${sky.id}_512.hdr`;
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (inspect) {
      console.log(`${filename}: ${bytes.length} bytes, ${digest}`);
      continue;
    }

    assert.equal(sky.low?.resolution, '512', `${sky.id}: Low must be 512 pixels wide`);
    assert.equal(sky.low?.sourceResolution, '1k', `${sky.id}: Low must derive from 1k`);
    assert.deepEqual(sky.low.generator, lowSkyGenerator, `${sky.id}: Low generator recipe changed`);
    assert.equal(sky.low.file.file, filename, `${sky.id}: Low filename changed`);
    verify(bytes, sky.low.file, 'sha256', `${sky.id} generated Low`);
    const target = join(skyDirectory, filename);
    const existing = await readExisting(target);
    if (existing) {
      verify(existing, sky.low.file, 'sha256', `${sky.id} committed Low`);
      assert.ok(existing.equals(bytes), `${sky.id}: committed and generated Low differ`);
      reused++;
    } else {
      await writeFile(target, bytes, { flag: 'wx' });
      generated++;
    }
    totalBytes += bytes.length;
    console.log(`${sky.id}: ${bytes.length} bytes, ${digest}`);
  }
  if (!inspect) console.log(`Verified ${generated + reused} pinned 512 × 256 skies (${totalBytes} bytes): ${generated} generated, ${reused} reused.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
