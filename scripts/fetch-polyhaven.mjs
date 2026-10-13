import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(join(root, 'assets.config.json'), 'utf8'));
const destination = join(root, 'public/assets/polyhaven');
const cache = join(root, '.cache/polyhaven');
const userAgent = 'After632/0.1 (+https://github.com/wangy113/after-632-gpt-sol-6)';
const run = promisify(execFile);

if (config.version !== 1 || !Array.isArray(config.textures)) {
  throw new Error('Unsupported assets.config.json format');
}

function verify(bytes, map, label) {
  const md5 = createHash('md5').update(bytes).digest('hex');
  if (bytes.length !== map.sizeBytes || md5 !== map.md5) {
    throw new Error(`${label}: expected ${map.sizeBytes} bytes / ${map.md5}, got ${bytes.length} bytes / ${md5}`);
  }
}

let downloaded = 0;
let reused = 0;
for (const texture of config.textures) {
  if (!/^[a-z0-9_]+$/.test(texture.id)) throw new Error(`Unsafe texture id: ${texture.id}`);
  if (texture.resolution !== '1k' || texture.format !== 'jpg') {
    throw new Error(`Unsupported texture format: ${texture.id}`);
  }

  for (const [kind, map] of Object.entries(texture.maps)) {
    const url = new URL(map.url);
    const filename = basename(url.pathname);
    if (url.protocol !== 'https:' || url.hostname !== 'dl.polyhaven.org'
      || !/^[a-z0-9_]+\.jpg$/.test(filename)
      || !Number.isSafeInteger(map.sizeBytes) || map.sizeBytes <= 0
      || !/^[a-f0-9]{32}$/.test(map.md5)) {
      throw new Error(`Invalid pinned map: ${texture.id}/${kind}`);
    }

    const target = join(destination, texture.id, filename);
    const label = `${texture.id}/${kind}`;
    try {
      verify(await readFile(target), map, label);
      console.log(`Verified existing ${label}`);
      reused++;
      continue;
    } catch (error) {
      if (error.code !== 'ENOENT' && !error.message?.startsWith(`${label}: expected`)) throw error;
    }

    const temporary = join(cache, texture.id, `${filename}.${randomUUID()}.tmp`);
    await mkdir(dirname(temporary), { recursive: true });
    try {
      // curl follows the system proxy in managed build environments and works on Node 22.
      await run('curl', [
        '--fail', '--location', '--silent', '--show-error',
        '--proto', '=https', '--proto-redir', '=https',
        '--max-time', '60', '--max-filesize', String(map.sizeBytes),
        '--user-agent', userAgent,
        '--output', temporary, map.url,
      ]);
      const bytes = await readFile(temporary);
      verify(bytes, map, label);
      await mkdir(dirname(target), { recursive: true });
      await rename(temporary, target);
      console.log(`Downloaded and verified ${label} (${bytes.length} bytes)`);
    } finally {
      await rm(temporary, { force: true });
    }
    downloaded++;
  }
}

console.log(`Poly Haven assets ready: ${downloaded} downloaded, ${reused} reused.`);
