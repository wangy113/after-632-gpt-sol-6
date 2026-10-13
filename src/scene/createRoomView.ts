import * as THREE from 'three/webgpu';
import { createRenderer } from '../render/renderer';
import { createRoomWorld } from '../world/room';

export interface RoomView {
  look(direction: 'left' | 'right' | 'up' | 'down' | 'reset'): void;
  dispose(): void;
}

/** A fixed doorway viewpoint. All drawing is requested by input or resize. */
export async function createRoomView(
  container: HTMLElement,
  onLost: () => void,
  forceWebGL: boolean,
): Promise<RoomView> {
  const { renderer, backend } = await createRenderer({ antialias: true, forceWebGL });
  const world = createRoomWorld();
  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
  camera.position.set(0, 1.6, 0.5);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.backend = backend;
  container.append(canvas);
  let disposed = false;
  let yaw = 0;
  let pitch = 0;
  let frame = 0;
  let raf = 0;
  let pointer: { id: number; x: number; y: number } | null = null;
  renderer.onDeviceLost = () => { if (!disposed) onLost(); };

  function requestRender() {
    if (disposed || raf || document.hidden) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (disposed || document.hidden) return;
      const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch),
      );
      camera.lookAt(camera.position.clone().add(direction));
      try {
        renderer.render(world.scene, camera);
      } catch {
        onLost();
        return;
      }
      if (disposed) return;
      canvas.dataset.frames = String(++frame);
      canvas.dataset.yaw = yaw.toFixed(3);
    });
  }

  function resize() {
    if (disposed) return;
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }

  function look(direction: 'left' | 'right' | 'up' | 'down' | 'reset') {
    if (direction === 'reset') { yaw = 0; pitch = 0; }
    if (direction === 'left') yaw = Math.max(-Math.PI, yaw - 0.22);
    if (direction === 'right') yaw = Math.min(Math.PI, yaw + 0.22);
    if (direction === 'up') pitch = Math.min(0.5, pitch + 0.12);
    if (direction === 'down') pitch = Math.max(-0.5, pitch - 0.12);
    requestRender();
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    container.focus({ preventScroll: true });
  }

  function pointerMove(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    yaw = THREE.MathUtils.clamp(yaw + (event.clientX - pointer.x) * 0.004, -Math.PI, Math.PI);
    pitch = THREE.MathUtils.clamp(pitch - (event.clientY - pointer.y) * 0.004, -0.5, 0.5);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    requestRender();
  }

  function pointerUp() { pointer = null; }
  function keyDown(event: KeyboardEvent) {
    const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    look(direction);
  }
  function visibility() { if (!document.hidden) requestRender(); }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  container.addEventListener('keydown', keyDown);
  document.addEventListener('visibilitychange', visibility);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    look,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      container.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      world.dispose();
      try { renderer.dispose(); } finally { canvas.remove(); }
    },
  };
}
