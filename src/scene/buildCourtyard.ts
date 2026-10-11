import * as THREE from 'three';

export function buildCourtyard(scene: THREE.Scene) {
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0xc7a079, roughness: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xe0c29a, roughness: 1 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xd5bb8b, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6e6045, roughness: 1 }),
    frond: new THREE.MeshStandardMaterial({ color: 0x617b4c, roughness: 1, side: THREE.DoubleSide }),
    shade: new THREE.MeshStandardMaterial({ color: 0x8e9364, roughness: 1 }),
  };
  const box = (size: [number, number, number], pos: [number, number, number], material = materials.wall) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  };
  box([18, .18, 14], [0, -.1, 0], materials.ground);
  // A single recognizable, intentionally unadorned enclosure. No identified sacred site.
  box([18, 2.7, .45], [0, 1.35, -7]);
  box([.45, 2.7, 14], [-9, 1.35, 0]);
  box([.45, 2.7, 14], [9, 1.35, 0]);
  box([18, .2, .58], [0, 2.8, -7], materials.trim);
  box([.58, .2, 14], [-9, 2.8, 0], materials.trim);
  box([.58, .2, 14], [9, 2.8, 0], materials.trim);
  // A low foreground ledge instead of a blocking front wall.
  box([18, .45, .8], [0, .225, 6.7]);
  box([18, .12, .88], [0, .5, 6.7], materials.trim);
  for (const x of [-7.7, -2.2]) for (const z of [-5.8, -1.8]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 2.7, 7), materials.wood);
    post.position.set(x, 1.35, z); post.castShadow = true; scene.add(post);
  }
  box([5.9, .15, .18], [-4.95, 2.7, -1.8], materials.wood);
  box([5.9, .15, .18], [-4.95, 2.7, -5.8], materials.wood);
  for (let i = 0; i < 15; i++) box([.27, .1, 4.4], [-7.8 + i * .41, 2.8, -3.8], materials.shade);
  // Palm-like vegetation is broad visual context, not a botanical reconstruction.
  function palm(x: number, z: number, height: number) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, height, 7), materials.wood);
    trunk.position.set(x, height / 2, z); trunk.castShadow = true; scene.add(trunk);
    for (let i = 0; i < 9; i++) {
      const angle = i * Math.PI * 2 / 9;
      const geometry = new THREE.BufferGeometry();
      const points: number[] = [];
      for (let step = 0; step < 5; step++) {
        const a = step / 5, b = (step + 1) / 5;
        const p = (t: number, side: number) => {
          const length = t * 2.2, width = Math.sin(t * Math.PI) * .34 * side;
          return [Math.cos(angle) * length + Math.sin(angle) * width, Math.sin(t * Math.PI) * .4 - t * .65, Math.sin(angle) * length - Math.cos(angle) * width];
        };
        points.push(...p(a, -1), ...p(b, -1), ...p(a, 1), ...p(a, 1), ...p(b, -1), ...p(b, 1));
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geometry.computeVertexNormals();
      const leaf = new THREE.Mesh(geometry, materials.frond); leaf.position.set(x, height, z); leaf.castShadow = true; scene.add(leaf);
    }
  }
  palm(5.6, -4.8, 4.1); palm(-7.4, 3.8, 3.5);
  // A few low plants and irregular ground marks create scale without clutter.
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.15, .65 + (i % 3) * .1, 4), materials.frond);
    leaf.position.set(5 + Math.sin(i * 3) * .35, .25, 1.5 + Math.cos(i * 3) * .35); leaf.rotation.z = Math.sin(i) * .3; scene.add(leaf);
  }
  for (let i = 0; i < 11; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(.06 + (i % 3) * .015, 0), materials.trim);
    stone.position.set(Math.sin(i * 4.3) * 6.5, .025, Math.cos(i * 7.1) * 5); stone.scale.y = .3; scene.add(stone);
  }
}
