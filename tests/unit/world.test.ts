import { describe, expect, it } from 'vitest';
import { createRoomWorld } from '../../src/world/room';
import { ABSENT_632_IDS, ADDED_661_IDS } from '../../src/schema/changeIds';

describe('dated room geometry', () => {
  it('shows exactly one dated change set while the shared room stays in place', () => {
    const world = createRoomWorld();
    try {
      const absent = world.scene.getObjectByName('632-absent')!;
      const added = world.scene.getObjectByName('661-added')!;
      const wall = world.scene.getObjectByName('back wall')!;

      expect(absent.visible).toBe(true);
      expect(added.visible).toBe(false);
      for (const id of Object.values(ABSENT_632_IDS)) expect(absent.getObjectByName(id)).toBeDefined();
      for (const id of Object.values(ADDED_661_IDS)) expect(added.getObjectByName(id)).toBeDefined();

      world.setDate('661');
      expect(absent.visible).toBe(false);
      expect(added.visible).toBe(true);
      expect(wall.visible).toBe(true);

      world.setDate('632');
      expect(absent.visible).toBe(true);
      expect(added.visible).toBe(false);
    } finally {
      world.dispose();
    }
  });
});
