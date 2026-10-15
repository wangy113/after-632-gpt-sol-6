import { cp, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkAssets } from '../../scripts/check-assets.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

async function assetFixture() {
  const root = await mkdtemp(join(tmpdir(), 'after632-assets-'));
  const committed = join(root, 'public/assets/polyhaven');
  const built = join(root, 'dist/assets/polyhaven');
  await cp(join(projectRoot, 'public/assets/polyhaven'), committed, { recursive: true });
  await cp(join(projectRoot, 'public/assets/polyhaven'), built, { recursive: true });
  await copyFile(join(projectRoot, 'assets.config.json'), join(root, 'assets.config.json'));
  await mkdir(join(root, 'dist/stills'), { recursive: true });
  await copyFile(join(projectRoot, 'public/stills/632-arrival.webp'),
    join(root, 'dist/stills/632-arrival.webp'));
  await writeFile(join(root, 'dist/index.html'),
    '<!doctype html><link rel="stylesheet" href="./style.css"><img id="arrival-still" src="./stills/632-arrival.webp">');
  await writeFile(join(root, 'dist/style.css'), 'body { color: black; }');
  return { root, committed, built };
}

describe('pinned asset gate', () => {
  it('accepts the Low maps and rejects changed or unlisted variants', async () => {
    const fixture = await assetFixture();
    try {
      const result = await checkAssets(fixture.root);
      expect(result).toMatchObject({ textureCount: 2, mapCount: 6, lowMapCount: 6, skyCount: 2 });
      expect(result.lowTextureBytes).toBeLessThan(result.textureBytes);
      expect(result.visitBytes).toBeLessThan(result.visitBudgetBytes);

      const config = JSON.parse(await readFile(join(fixture.root, 'assets.config.json'), 'utf8'));
      const texture = config.textures[0];
      const lowMap = join(fixture.committed, texture.id, texture.low.maps.Diffuse.file);
      const original = await readFile(lowMap);
      await writeFile(lowMap, Buffer.alloc(original.length));
      await expect(checkAssets(fixture.root)).rejects.toThrow(`Committed Low ${texture.id}/Diffuse: expected`);

      await writeFile(lowMap, original);
      await writeFile(join(fixture.built, texture.id, 'unlisted_512.webp'), 'extra map');
      await expect(checkAssets(fixture.root)).rejects.toThrow(
        'Built Poly Haven files must match the pinned asset list exactly');
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
});
