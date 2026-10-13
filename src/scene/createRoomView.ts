import * as THREE from 'three/webgpu';
import { createRenderer } from '../render/renderer';
import type { RoomDate } from '../schema/changeIds';
import type { PlaceId } from '../state/places';
import { createRoomWorld } from '../world/room';

export interface RoomView {
  look(direction: 'left' | 'right' | 'up' | 'down' | 'reset'): void;
  moveTo(place: PlaceId, animate: boolean, onArrive?: () => void): void;
  skipMovement(): void;
  setDate(date: RoomDate): void;
  dispose(): void;
}

const viewpoints: Record<PlaceId, { position: [number, number, number]; yaw: number; pitch: number }> = {
  doorway: { position: [0, 1.6, 0.5], yaw: 0, pitch: -0.3 },
  head: { position: [-1.55, 1.6, -3.65], yaw: Math.PI, pitch: -0.22 },
  pegs: { position: [2, 1.6, -1.35], yaw: Math.PI / 2, pitch: -0.1 },
  yard: { position: [0, 1.6, 4.4], yaw: 0, pitch: -0.12 },
};
const moveDuration = 800;

interface Movement {
  points: THREE.Vector3[];
  distances: number[];
  totalDistance: number;
  fromYaw: number;
  toYaw: number;
  targetYaw: number;
  fromPitch: number;
  toPitch: number;
  startedAt: number | null;
  onArrive?: () => void;
}

/** One camera moves among four standing points; drawing stops when the view is still. */
export async function createRoomView(
  container: HTMLElement,
  onLost: () => void,
  forceWebGL: boolean,
): Promise<RoomView> {
  const { renderer, backend } = await createRenderer({ antialias: true, forceWebGL });
  const world = createRoomWorld();
  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
  camera.position.set(...viewpoints.doorway.position);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.backend = backend;
  canvas.dataset.date = '632';
  canvas.dataset.place = 'doorway';
  canvas.dataset.moving = 'false';
  container.append(canvas);
  let disposed = false;
  let place: PlaceId = 'doorway';
  let yaw = 0;
  let pitch = viewpoints.doorway.pitch;
  let frame = 0;
  let raf = 0;
  let movement: Movement | null = null;
  let pointer: { id: number; x: number; y: number } | null = null;
  renderer.onDeviceLost = () => { if (!disposed) onLost(); };

  function recordPose() {
    canvas.dataset.yaw = yaw.toFixed(3);
    canvas.dataset.position = camera.position.toArray().map(value => value.toFixed(3)).join(',');
  }

  function requestRender() {
    if (disposed || raf || document.hidden) return;
    raf = requestAnimationFrame(now => {
      raf = 0;
      if (disposed || document.hidden) return;
      if (movement) {
        const active = movement;
        active.startedAt ??= now;
        const progress = Math.min(1, (now - active.startedAt) / moveDuration);
        const eased = progress * progress * (3 - 2 * progress);
        const distance = eased * active.totalDistance;
        let segment = 1;
        while (segment < active.distances.length - 1 && distance > active.distances[segment]) segment++;
        const startDistance = active.distances[segment - 1];
        const length = active.distances[segment] - startDistance;
        const fraction = length ? (distance - startDistance) / length : 1;
        camera.position.lerpVectors(active.points[segment - 1], active.points[segment], fraction);
        yaw = active.fromYaw + (active.toYaw - active.fromYaw) * eased;
        pitch = THREE.MathUtils.lerp(active.fromPitch, active.toPitch, eased);
        if (progress === 1) {
          yaw = active.targetYaw;
          movement = null;
          canvas.dataset.moving = 'false';
          active.onArrive?.();
        }
      }
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
      recordPose();
      if (movement) requestRender();
    });
  }

  function finishMovement() {
    if (!movement) return;
    const active = movement;
    movement = null;
    camera.position.copy(active.points.at(-1)!);
    yaw = active.targetYaw;
    pitch = active.toPitch;
    canvas.dataset.moving = 'false';
    recordPose();
    active.onArrive?.();
    requestRender();
  }

  function moveTo(nextPlace: PlaceId, animate: boolean, onArrive?: () => void) {
    if (disposed) return;
    const target = viewpoints[nextPlace];
    place = nextPlace;
    canvas.dataset.place = nextPlace;
    movement = null;
    if (!animate) {
      camera.position.set(...target.position);
      yaw = target.yaw;
      pitch = target.pitch;
      canvas.dataset.moving = 'false';
      recordPose();
      onArrive?.();
      requestRender();
      return;
    }

    const start = camera.position.clone();
    const end = new THREE.Vector3(...target.position);
    const points = [start];
    // Trips across the front wall pass through its opening, including interrupted moves.
    if ((start.z < 0 && end.z > 1) || (start.z > 1 && end.z < 0)) {
      points.push(new THREE.Vector3(...viewpoints.doorway.position));
    }
    points.push(end);
    const distances = [0];
    for (let index = 1; index < points.length; index++) {
      distances.push(distances[index - 1] + points[index].distanceTo(points[index - 1]));
    }
    const shortestTurn = Math.atan2(Math.sin(target.yaw - yaw), Math.cos(target.yaw - yaw));
    movement = {
      points,
      distances,
      totalDistance: distances.at(-1)!,
      fromYaw: yaw,
      toYaw: yaw + shortestTurn,
      targetYaw: target.yaw,
      fromPitch: pitch,
      toPitch: target.pitch,
      startedAt: null,
      onArrive,
    };
    canvas.dataset.moving = 'true';
    requestRender();
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
    finishMovement();
    const center = viewpoints[place].yaw;
    if (direction === 'reset') { yaw = center; pitch = viewpoints[place].pitch; }
    if (direction === 'left') yaw = Math.max(center - Math.PI, yaw - 0.22);
    if (direction === 'right') yaw = Math.min(center + Math.PI, yaw + 0.22);
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
    finishMovement();
    const center = viewpoints[place].yaw;
    yaw = THREE.MathUtils.clamp(yaw + (event.clientX - pointer.x) * 0.004, center - Math.PI, center + Math.PI);
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
  function visibility() {
    if (document.hidden) finishMovement();
    else requestRender();
  }

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
    moveTo,
    skipMovement: finishMovement,
    setDate(date) {
      if (disposed) return;
      world.setDate(date);
      canvas.dataset.date = date;
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      movement = null;
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
