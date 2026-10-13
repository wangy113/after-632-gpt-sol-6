import * as THREE from 'three/webgpu';
import { ADDED_661_IDS } from '../schema/changeIds';

export interface Added661ChangeSet {
  root: THREE.Group;
  objects: {
    facingSeat: THREE.Group;
    sealedLetter: THREE.Group;
    coin661: THREE.Group;
    emptyPegs: THREE.Group;
  };
  setVisible(visible: boolean): void;
  dispose(): void;
}

/** Four invented traces of 661, built as plain geometry without museum imagery. */
export function addAdded661(scene: THREE.Scene): Added661ChangeSet {
  const root = new THREE.Group();
  root.name = '661-added';
  const facingSeat = new THREE.Group();
  facingSeat.name = ADDED_661_IDS.facingSeat;
  const sealedLetter = new THREE.Group();
  sealedLetter.name = ADDED_661_IDS.sealedLetter;
  const coin661 = new THREE.Group();
  coin661.name = ADDED_661_IDS.coin661;
  const emptyPegs = new THREE.Group();
  emptyPegs.name = ADDED_661_IDS.emptyPegs;
  root.add(facingSeat, sealedLetter, coin661, emptyPegs);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  function material(color: number, opacity = 1): THREE.MeshStandardMaterial {
    const result = new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
      side: THREE.DoubleSide,
    });
    materials.add(result);
    return result;
  }
  const mat = material(0x858987);
  const wood = material(0x777b79);
  const paper = material(0xc3c4c0);
  const seal = material(0x999c98);
  const coin = material(0x9b9e9a);
  const trace = material(0xd1d1cd, 0.55);

  function mesh(group: THREE.Group, name: string, geometry: THREE.BufferGeometry, surface: THREE.Material): THREE.Mesh {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, surface);
    result.name = name;
    result.castShadow = true;
    result.receiveShadow = true;
    group.add(result);
    return result;
  }
  function box(
    group: THREE.Group, name: string, width: number, height: number, depth: number,
    x: number, y: number, z: number, surface: THREE.Material,
  ): THREE.Mesh {
    const result = mesh(group, name, new THREE.BoxGeometry(width, height, depth), surface);
    result.position.set(x, y, z);
    return result;
  }

  // The old circle gives way to two short rows, facing a single unadorned seat.
  for (const [index, [x, z]] of [
    [-0.95, -1.15], [0, -1.15], [0.95, -1.15],
    [-0.95, -2.05], [0, -2.05], [0.95, -2.05],
  ].entries()) {
    box(facingSeat, `661-facing-mat-${index + 1}`, 0.72, 0.035, 0.58, x, 0.018, z, mat);
  }
  box(facingSeat, '661-plain-seat-base', 0.94, 0.32, 0.72, 0, 0.16, -4.0, wood);
  box(facingSeat, '661-plain-seat-back', 0.94, 0.72, 0.11, 0, 0.51, -4.31, wood);

  // One low table supports a folded, unmarked letter and a separate replica disc.
  box(sealedLetter, '661-low-table-top', 1.45, 0.09, 0.75, 1.9, 0.46, -3.52, wood);
  for (const [side, x] of [1.35, 2.45].entries()) {
    for (const [end, z] of [-3.78, -3.26].entries()) {
      box(sealedLetter, `661-low-table-leg-${side}-${end}`, 0.09, 0.41, 0.09, x, 0.205, z, wood);
    }
  }
  box(sealedLetter, '661-folded-letter', 0.42, 0.018, 0.28, 1.64, 0.518, -3.5, paper);
  const wax = mesh(sealedLetter, '661-plain-seal', new THREE.CylinderGeometry(0.055, 0.055, 0.015, 12), seal);
  wax.position.set(1.64, 0.538, -3.5);

  const replica = mesh(coin661, '661-interpretive-coin-replica', new THREE.CylinderGeometry(0.12, 0.12, 0.023, 24), coin);
  replica.position.set(2.17, 0.524, -3.5);
  replica.userData.authenticity = 'interpretive-replica';

  // Flat, pale patches sit behind bare pegs on the side wall near the doorway.
  for (const [index, z] of [-0.7, -1.1, -1.5].entries()) {
    box(emptyPegs, `661-peg-trace-${index + 1}`, 0.008, 0.32, 0.22, 3.987, 1.45, z, trace);
    const peg = mesh(emptyPegs, `661-empty-peg-${index + 1}`, new THREE.CylinderGeometry(0.025, 0.03, 0.19, 8), wood);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(3.89, 1.53, z);
  }

  scene.add(root);
  let disposed = false;
  return {
    root,
    objects: { facingSeat, sealedLetter, coin661, emptyPegs },
    setVisible(visible) { root.visible = visible; },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const surface of materials) surface.dispose();
    },
  };
}
