import * as THREE from 'three';
import { buildCourtyard } from './buildCourtyard';
import { presets } from './presets';
import type { MomentId } from '../state';

export interface CourtyardScene {
  select(id: MomentId, animate: boolean): void;
  skip(): void;
  view(direction: string): void;
  dispose(): void;
}
export function createScene(container: HTMLElement, onLost: () => void): CourtyardScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(presets['632'].sky);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.dataset.renderer = 'courtyard';
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 70);
  const target = new THREE.Vector3(0, 1.8, -2);
  let theta = .3, phi = 1.34;
  function positionCamera() { camera.position.setFromSpherical(new THREE.Spherical(8.4, phi, theta)).add(target); camera.lookAt(target); }
  positionCamera();
  const sun = new THREE.DirectionalLight(presets['632'].color, presets['632'].intensity);
  sun.position.set(...presets['632'].position); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -12; sun.shadow.camera.right = 12; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  sun.shadow.normalBias = .04; sun.shadow.bias = -.0001; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xe2ecd5, 0xa18a6b, 2.3));
  buildCourtyard(scene);
  container.append(renderer.domElement);
  let disposed = false, raf = 0, visible = true;
  let selected: MomentId = '632';
  let transition: { start: number; position: THREE.Vector3; color: THREE.Color; intensity: number; sky: THREE.Color } | null = null;
  let renders = 0;
  function finish() {
    const preset = presets[selected];
    sun.position.set(...preset.position); sun.color.set(preset.color); sun.intensity = preset.intensity;
    (scene.background as THREE.Color).set(preset.sky); transition = null;
  }
  function request() { if (!disposed && !raf && !document.hidden && visible) raf = requestAnimationFrame(render); }
  function render(now: number) {
    raf = 0; if (disposed || document.hidden || !visible) return;
    if (transition) {
      const t = Math.min((now - transition.start) / 1200, 1), eased = t * t * (3 - 2 * t), preset = presets[selected];
      sun.position.lerpVectors(transition.position, new THREE.Vector3(...preset.position), eased);
      sun.color.copy(transition.color).lerp(new THREE.Color(preset.color), eased);
      sun.intensity = THREE.MathUtils.lerp(transition.intensity, preset.intensity, eased);
      (scene.background as THREE.Color).copy(transition.sky).lerp(new THREE.Color(preset.sky), eased);
      if (t === 1) finish();
    }
    renderer.render(scene, camera);
    renderer.domElement.dataset.frames = String(++renders);
    renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
    renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
    if (transition) request();
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); request();
  });
  resize.observe(container);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) { cancelAnimationFrame(raf); raf = 0; finish(); } else request(); });
  intersection.observe(container);
  function visibility() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; finish(); } else request(); }
  document.addEventListener('visibilitychange', visibility);
  let pointer: { id: number; x: number; y: number } | null = null;
  function down(event: PointerEvent) { if (event.button !== 0) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); }
  function move(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    theta = THREE.MathUtils.clamp(theta - (event.clientX - pointer.x) * .004, -.95, 1.2);
    if (event.pointerType !== 'touch') phi = THREE.MathUtils.clamp(phi - (event.clientY - pointer.y) * .004, .92, 1.42);
    pointer.x = event.clientX; pointer.y = event.clientY; positionCamera(); request();
  }
  function up() { pointer = null; }
  function lost(event: Event) { event.preventDefault(); if (!disposed) onLost(); }
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up);
  renderer.domElement.addEventListener('webglcontextlost', lost);
  request();
  return {
    select(id, animate) {
      selected = id;
      transition = animate ? { start: performance.now(), position: sun.position.clone(), color: sun.color.clone(), intensity: sun.intensity, sky: (scene.background as THREE.Color).clone() } : null;
      if (!animate) finish();
      renderer.domElement.dataset.moment = id; request();
    },
    skip() { finish(); request(); },
    view(direction) {
      if (direction === 'reset') { theta = .3; phi = 1.34; }
      if (direction === 'left') theta = Math.max(-.95, theta - .14);
      if (direction === 'right') theta = Math.min(1.2, theta + .14);
      if (direction === 'up') phi = Math.max(.92, phi - .1);
      if (direction === 'down') phi = Math.min(1.42, phi + .1);
      positionCamera(); request();
    },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); resize.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('webglcontextlost', lost);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); } });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      sun.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); scene.clear();
    },
  };
}
