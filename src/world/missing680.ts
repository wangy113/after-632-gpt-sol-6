import * as THREE from 'three/webgpu';
import { MISSING_680_IDS } from '../schema/changeIds';

export interface Missing680ChangeSet {
  root: THREE.Group;
  objects: {
    cleanPatch: THREE.Group;
    emptyHook: THREE.Group;
    tallerPalm: THREE.Group;
  };
  setVisible(visible: boolean): void;
  dispose(): void;
}

/** Marks ordinary things missing in 680; no person or historical owner is depicted. */
export function addMissing680(scene: THREE.Scene, tallerPalm: THREE.Group, floorMarkOpacity = 0.45): Missing680ChangeSet {
  const root = new THREE.Group();
  root.name = '680-missing';
  const cleanPatch = new THREE.Group();
  cleanPatch.name = MISSING_680_IDS.cleanPatch;
  const emptyHook = new THREE.Group();
  emptyHook.name = MISSING_680_IDS.emptyHook;
  tallerPalm.name = MISSING_680_IDS.tallerPalm;
  root.add(cleanPatch, emptyHook, tallerPalm);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const floorTrace = new THREE.MeshBasicMaterial({
    color: 0xe7e6de,
    transparent: true,
    opacity: floorMarkOpacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wallTrace = new THREE.MeshStandardMaterial({
    color: 0xd1d1cd,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    roughness: 1,
  });
  const hookSurface = new THREE.MeshStandardMaterial({ color: 0x777b79, roughness: 1 });
  materials.add(floorTrace);
  materials.add(wallTrace);
  materials.add(hookSurface);

  const patchGeometry = new THREE.CircleGeometry(1, 24);
  geometries.add(patchGeometry);
  const patch = new THREE.Mesh(patchGeometry, floorTrace);
  patch.name = '680-clean-floor-patch';
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(1.93, 0.006, -2.31);
  patch.scale.set(0.68, 0.75, 1);
  cleanPatch.add(patch);

  const outlineGeometry = new THREE.BoxGeometry(0.008, 0.57, 0.38);
  geometries.add(outlineGeometry);
  const outline = new THREE.Mesh(outlineGeometry, wallTrace);
  outline.name = '680-waterskin-wall-outline';
  outline.position.set(3.992, 1.19, -2.10);
  emptyHook.add(outline);

  const hookGeometry = new THREE.CylinderGeometry(0.027, 0.03, 0.22, 8);
  geometries.add(hookGeometry);
  const hook = new THREE.Mesh(hookGeometry, hookSurface);
  hook.name = '680-empty-travel-hook';
  hook.rotation.z = Math.PI / 2;
  hook.position.set(3.89, 1.55, -2.10);
  hook.castShadow = true;
  emptyHook.add(hook);

  scene.add(root);
  let disposed = false;
  return {
    root,
    objects: { cleanPatch, emptyHook, tallerPalm },
    setVisible(visible) { root.visible = visible; },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      // The palm clone shares geometry and materials with the room's palm.
      // Only the room disposes those resources.
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
