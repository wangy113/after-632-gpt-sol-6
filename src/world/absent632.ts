import * as THREE from 'three/webgpu';
import { ABSENT_632_IDS } from '../schema/changeIds';

export interface Absent632ChangeSet {
  root: THREE.Group;
  objects: {
    matsAndCups: THREE.Group;
    emptyHead: THREE.Group;
    footprints: THREE.Group;
  };
  setVisible(visible: boolean): void;
  dispose(): void;
}

/** Adds the imagined 632 traces to the room; the caller owns this change set. */
export function addAbsent632(scene: THREE.Scene): Absent632ChangeSet {
  const root = new THREE.Group();
  root.name = '632-absent';

  const matsAndCups = new THREE.Group();
  matsAndCups.name = ABSENT_632_IDS.matsAndCups;
  const emptyHead = new THREE.Group();
  emptyHead.name = ABSENT_632_IDS.emptyHead;
  // The empty place is a deliberate gap, not a marker or a depicted person.
  emptyHead.position.set(0, 0, -4.12);
  const footprints = new THREE.Group();
  footprints.name = ABSENT_632_IDS.footprints;
  root.add(matsAndCups, emptyHead, footprints);

  const matMaterial = new THREE.MeshStandardMaterial({ color: 0x858987, roughness: 1 });
  const cupMaterial = new THREE.MeshStandardMaterial({ color: 0x777b79, roughness: 1, side: THREE.DoubleSide });
  const footprintMaterial = new THREE.MeshBasicMaterial({
    color: 0x666a68,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const matGeometry = new THREE.BoxGeometry(0.88, 0.035, 0.56);
  const cupGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.085, 0),
    new THREE.Vector2(0.105, 0.02),
    new THREE.Vector2(0.11, 0.15),
    new THREE.Vector2(0.085, 0.16),
    new THREE.Vector2(0.075, 0.135),
    new THREE.Vector2(0.07, 0.045),
    new THREE.Vector2(0, 0.045),
  ], 10);
  const printGeometry = new THREE.CircleGeometry(1, 12);

  // Seven low mats loosely encircle the center. The far side is left open.
  const matAngles = [-2.4, -1.65, -0.8, -0.06, 0.8, 1.65, 2.4];
  for (const [index, angle] of matAngles.entries()) {
    const mat = new THREE.Mesh(matGeometry, matMaterial);
    mat.name = `632-mat-${index + 1}`;
    mat.position.set(Math.sin(angle) * 1.7, 0.018, -2.65 + Math.cos(angle) * 1.43);
    mat.rotation.y = angle + (index % 2 ? 0.045 : -0.035);
    mat.receiveShadow = true;
    matsAndCups.add(mat);
  }

  // Ordinary cups have no individual owner or implied historical identity.
  for (const [index, x, z] of [
    [1, -0.48, -2.2],
    [2, 0.18, -2.47],
    [3, 0.65, -2.05],
  ] as const) {
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.name = `632-cup-${index}`;
    cup.position.set(x, 0.008, z);
    cup.castShadow = true;
    cup.receiveShadow = true;
    matsAndCups.add(cup);
  }

  // A quiet sequence begins near the circle and crosses the threshold. Each
  // pair of flat ovals is an abstract footprint in this invented setting.
  for (let index = 0; index < 9; index += 1) {
    const print = new THREE.Group();
    print.name = `632-footprint-${index + 1}`;
    print.position.set(2.45 - index * 0.15 + (index % 2 ? 0.11 : -0.11), 0.008, -3.3 + index * 0.44);
    const heel = new THREE.Mesh(printGeometry, footprintMaterial);
    heel.rotation.x = -Math.PI / 2;
    heel.scale.set(0.067, 0.09, 1);
    heel.position.z = -0.09;
    const forefoot = new THREE.Mesh(printGeometry, footprintMaterial);
    forefoot.rotation.x = -Math.PI / 2;
    forefoot.scale.set(0.09, 0.115, 1);
    forefoot.position.z = 0.08;
    print.add(heel, forefoot);
    footprints.add(print);
  }

  scene.add(root);
  let disposed = false;
  return {
    root,
    objects: { matsAndCups, emptyHead, footprints },
    setVisible(visible) { root.visible = visible; },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      matGeometry.dispose();
      cupGeometry.dispose();
      printGeometry.dispose();
      matMaterial.dispose();
      cupMaterial.dispose();
      footprintMaterial.dispose();
    },
  };
}
