import * as THREE from 'three/webgpu';
import assetConfig from '../../assets.config.json' with { type: 'json' };
import type { RenderTier } from '../render/tiers';

interface TextureSet {
  diffuse: THREE.Texture;
  normal: THREE.Texture;
  arm: THREE.Texture;
}

export interface RoomTextures {
  wall: TextureSet;
  floor: TextureSet;
  dispose(): void;
}

type TextureRecord = typeof assetConfig.textures[number];
type MapName = keyof TextureRecord['maps'];

function textureUrl(record: TextureRecord, map: MapName, tier: RenderTier): string {
  const fileName = tier === 'low'
    ? record.low.maps[map].file
    : record.maps[map].url.slice(record.maps[map].url.lastIndexOf('/') + 1);
  return `${import.meta.env.BASE_URL}assets/polyhaven/${record.id}/${fileName}`;
}

/** Load committed, verified copies before showing the room. */
export async function loadRoomTextures(tier: RenderTier): Promise<RoomTextures> {
  const wall = assetConfig.textures.find(record => record.role === 'room-walls');
  const floor = assetConfig.textures.find(record => record.role === 'room-floor');
  if (!wall || !floor) throw new Error('Wall or floor texture record is missing');

  const loader = new THREE.TextureLoader();
  const requests = [wall, floor].flatMap(record =>
    (['Diffuse', 'nor_gl', 'arm'] as const).map(map => loader.loadAsync(textureUrl(record, map, tier))),
  );
  const results = await Promise.allSettled(requests);
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    for (const result of results) if (result.status === 'fulfilled') result.value.dispose();
    throw new Error('A room texture could not load', { cause: failed.reason });
  }

  const loaded = results.map(result => (result as PromiseFulfilledResult<THREE.Texture>).value);
  for (const [index, texture] of loaded.entries()) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    if (index % 3 === 0) texture.colorSpace = THREE.SRGBColorSpace;
  }
  return {
    wall: { diffuse: loaded[0], normal: loaded[1], arm: loaded[2] },
    floor: { diffuse: loaded[3], normal: loaded[4], arm: loaded[5] },
    dispose() { for (const texture of loaded) texture.dispose(); },
  };
}
