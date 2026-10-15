import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three/webgpu';
import { createRoomWorld } from '../../src/world/room';
import { ABSENT_632_IDS, ADDED_661_IDS, MISSING_680_IDS } from '../../src/schema/changeIds';

describe('dated room geometry', () => {
  it('keeps the shared room and 661 seat while travel things disappear in 680', () => {
    const world = createRoomWorld();
    try {
      const absent = world.scene.getObjectByName('632-absent')!;
      const added = world.scene.getObjectByName('661-added')!;
      const missing = world.scene.getObjectByName('680-missing')!;
      const travel = added.getObjectByName(ADDED_661_IDS.travelThings)!;
      const seat = added.getObjectByName(ADDED_661_IDS.facingSeat)!;
      const wall = world.scene.getObjectByName('back wall')!;
      const palm = world.scene.getObjectByName('yard palm')!;
      const tallerPalm = missing.getObjectByName(MISSING_680_IDS.tallerPalm)!;

      expect(absent.visible).toBe(true);
      expect(added.visible).toBe(false);
      expect(missing.visible).toBe(false);
      expect(palm.visible).toBe(true);
      for (const id of Object.values(ABSENT_632_IDS)) expect(absent.getObjectByName(id)).toBeDefined();
      for (const id of Object.values(ADDED_661_IDS)) expect(added.getObjectByName(id)).toBeDefined();
      for (const id of Object.values(MISSING_680_IDS)) expect(missing.getObjectByName(id)).toBeDefined();

      const baseTrunk = palm.getObjectByName('yard palm trunk') as THREE.Mesh;
      const tallerTrunk = tallerPalm.getObjectByName('yard palm trunk') as THREE.Mesh;
      expect(tallerTrunk.geometry).toBe(baseTrunk.geometry);
      expect(tallerTrunk.material).toBe(baseTrunk.material);
      expect(tallerPalm.scale.y).toBeGreaterThan(palm.scale.y);

      world.setDate('661');
      expect(absent.visible).toBe(false);
      expect(added.visible).toBe(true);
      expect(travel.visible).toBe(true);
      expect(missing.visible).toBe(false);
      expect(palm.visible).toBe(true);
      expect(wall.visible).toBe(true);

      world.setDate('680');
      expect(absent.visible).toBe(false);
      expect(added.visible).toBe(true);
      expect(seat.visible).toBe(true);
      expect(travel.visible).toBe(false);
      expect(missing.visible).toBe(true);
      expect(palm.visible).toBe(false);
      expect(wall.visible).toBe(true);

      world.setDate('632');
      expect(absent.visible).toBe(true);
      expect(added.visible).toBe(false);
      expect(missing.visible).toBe(false);
      expect(palm.visible).toBe(true);
    } finally {
      world.dispose();
    }
  });

  it('disposes shared palm geometry only once', () => {
    const world = createRoomWorld();
    const palm = world.scene.getObjectByName('yard palm')!;
    const trunk = palm.getObjectByName('yard palm trunk') as THREE.Mesh;
    const dispose = vi.spyOn(trunk.geometry, 'dispose');
    world.setDate('680');
    world.dispose();
    world.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('releases the opt-in floor-mark edge texture when the room closes', () => {
    const world = createRoomWorld(undefined, undefined, false, 0.30, true);
    const patch = world.scene.getObjectByName('680-clean-floor-patch') as THREE.Mesh;
    const map = (patch.material as THREE.MeshBasicMaterial).map;
    expect(map).toBeInstanceOf(THREE.DataTexture);
    const dispose = vi.spyOn(map!, 'dispose');
    world.dispose();
    world.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
