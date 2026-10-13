import * as THREE from 'three/webgpu';
import type { RoomDate } from '../schema/changeIds';
import { addAbsent632 } from './absent632';
import { addAdded661 } from './added661';
import { addMissing680 } from './missing680';
import type { RoomTextures } from './roomTextures';

/** A stable imagined room and yard with all three dated details. */
export function createRoomWorld(textures?: RoomTextures, sky?: THREE.DataTexture): { scene: THREE.Scene; setDate(date: RoomDate): void; dispose(): void } {
  const scene = new THREE.Scene();
  scene.background = sky ?? new THREE.Color(0xd9dad8);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const plaster = new THREE.MeshStandardMaterial({
    color: textures ? 0xffffff : 0xbabbb8,
    roughness: 1,
    aoMapIntensity: 0.6,
    ...(textures ? {
      map: textures.wall.diffuse,
      normalMap: textures.wall.normal,
      aoMap: textures.wall.arm,
      roughnessMap: textures.wall.arm,
    } : {}),
  });
  const ground = new THREE.MeshStandardMaterial({
    color: textures ? 0xffffff : 0xaaa9a4,
    roughness: 1,
    aoMapIntensity: 0.6,
    ...(textures ? {
      map: textures.floor.diffuse,
      normalMap: textures.floor.normal,
      aoMap: textures.floor.arm,
      roughnessMap: textures.floor.arm,
    } : {}),
  });
  const roof = new THREE.MeshStandardMaterial({ color: 0x9d9e9b, roughness: 1 });
  const beam = new THREE.MeshStandardMaterial({ color: 0x7e807d, roughness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x898b88, roughness: 1, side: THREE.DoubleSide });
  const foliage = new THREE.MeshStandardMaterial({ color: 0x919590, roughness: 1 });
  for (const material of [plaster, ground, roof, beam, stone, foliage]) materials.add(material);

  function add(
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = scene,
  ): THREE.Mesh {
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function box(
    name: string,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    if (textures && (material === plaster || material === ground)) {
      const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
      const tileSize = material === plaster ? 2.5 : 2;
      const faces: [number, number][] = [
        [depth, height], [depth, height],
        [width, depth], [width, depth],
        [width, height], [width, height],
      ];
      for (const [face, [uSpan, vSpan]] of faces.entries()) {
        for (let vertex = 0; vertex < 4; vertex += 1) {
          const index = face * 4 + vertex;
          uv.setXY(index, uv.getX(index) * uSpan / tileSize, uv.getY(index) * vSpan / tileSize);
        }
      }
      uv.needsUpdate = true;
    }
    const mesh = add(name, geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Room: x = -4..4, z = -5..0. The 3.2 m wide front opening faces the yard.
  box('room floor', 8, 0.12, 5, 0, -0.06, -2.5, ground);
  box('back wall', 8.2, 3.1, 0.2, 0, 1.55, -5.1, plaster);
  box('left wall', 0.2, 3.1, 5.2, -4.1, 1.55, -2.5, plaster);
  box('right wall', 0.2, 3.1, 5.2, 4.1, 1.55, -2.5, plaster);
  box('doorway left wall', 2.4, 3.1, 0.2, -2.8, 1.55, 0.1, plaster);
  box('doorway right wall', 2.4, 3.1, 0.2, 2.8, 1.55, 0.1, plaster);
  box('doorway lintel', 3.2, 0.55, 0.2, 0, 2.825, 0.1, plaster);
  box('roof', 8.4, 0.16, 5.4, 0, 3.18, -2.5, roof);
  for (const [index, z] of [-4.55, -3.15, -1.75, -0.35].entries()) {
    box(`roof beam ${index + 1}`, 8.1, 0.17, 0.16, 0, 3.01, z, beam);
  }

  // Yard: x = -4..4, z = 0..6. Its low walls leave the doorway unobstructed.
  box('yard floor', 8, 0.12, 6, 0, -0.06, 3, ground);
  box('yard left wall', 0.2, 1.05, 6, -4.1, 0.525, 3, plaster);
  box('yard right wall', 0.2, 1.05, 6, 4.1, 0.525, 3, plaster);
  box('yard back wall', 8.2, 1.05, 0.2, 0, 0.525, 6.1, plaster);

  // The well and palm locate the yard. They carry no date-specific meaning.
  const well = add('yard well', new THREE.CylinderGeometry(0.72, 0.76, 0.82, 16, 1, true), stone);
  well.position.set(2.55, 0.41, 3.7);
  const wellRim = add('yard well rim', new THREE.TorusGeometry(0.72, 0.1, 6, 16), stone);
  wellRim.rotation.x = Math.PI / 2;
  wellRim.position.set(2.55, 0.83, 3.7);

  const palmX = -2.45;
  const palmZ = 4.1;
  const palm = new THREE.Group();
  palm.name = 'yard palm';
  scene.add(palm);
  const trunk = add('yard palm trunk', new THREE.CylinderGeometry(0.12, 0.2, 3.1, 8), beam, palm);
  trunk.position.set(palmX, 1.55, palmZ);
  trunk.rotation.z = -0.055;
  for (let index = 0; index < 7; index += 1) {
    const angle = index * Math.PI * 2 / 7;
    const frond = add(`yard palm frond ${index + 1}`, new THREE.SphereGeometry(1, 8, 5), foliage, palm);
    frond.scale.set(1.1, 0.08, 0.22);
    frond.rotation.y = -angle;
    frond.position.set(palmX + Math.cos(angle) * 0.78, 3.0, palmZ + Math.sin(angle) * 0.78);
  }

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(-3, 8, 5);
  sun.target.position.set(0, 0, -2);
  scene.add(ambient, sun, sun.target);

  // All change sets remain in the same room so switching preserves the viewpoint.
  // The later palm reuses the same meshes' geometry and materials; these remain
  // owned by the room and are disposed exactly once below.
  const tallerPalm = palm.clone(true);
  tallerPalm.scale.y = 1.19;
  const absent632 = addAbsent632(scene);
  const added661 = addAdded661(scene);
  const missing680 = addMissing680(scene, tallerPalm);
  added661.setVisible(false);
  missing680.setVisible(false);
  let disposed = false;

  return {
    scene,
    setDate(date) {
      if (disposed) return;
      absent632.setVisible(date === '632');
      added661.setVisible(date === '661' || date === '680');
      added661.setTravelVisible(date === '661');
      missing680.setVisible(date === '680');
      palm.visible = date !== '680';
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      absent632.dispose();
      added661.dispose();
      missing680.dispose();
      scene.clear();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      textures?.dispose();
      sky?.dispose();
    },
  };
}
