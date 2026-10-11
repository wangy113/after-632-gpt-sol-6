import * as THREE from 'three';
import type { MomentId } from '../state';

export interface CourtyardScene {
  select(id: MomentId, animate: boolean): void;
  skip(): void;
  view(direction: string): void;
  dispose(): void;
}

/** Photographic, path-traced views of one fixed courtyard, projected interactively. */
export function createScene(container: HTMLElement, onLost: () => void): CourtyardScene {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // The photographs already contain the render's exposure and color transform.
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.renderer = 'courtyard'; canvas.dataset.assets = 'loading';
  container.append(canvas);

  const placeholder = new THREE.DataTexture(new Uint8Array([63, 65, 49, 255]), 1, 1);
  placeholder.needsUpdate = true;
  const uniforms = {
    imageA: { value: placeholder as THREE.Texture }, imageB: { value: placeholder as THREE.Texture },
    blend: { value: 0 }, yaw: { value: 0 }, pitch: { value: 0 }, aspect: { value: 1 },
    lens: { value: Math.tan(THREE.MathUtils.degToRad(55 / 2)) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec2 screenUV;
      void main() { screenUV = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D imageA; uniform sampler2D imageB;
      uniform float blend; uniform float yaw; uniform float pitch; uniform float aspect; uniform float lens;
      varying vec2 screenUV;
      void main() {
        vec2 p = screenUV * 2.0 - 1.0;
        vec3 ray = normalize(vec3(p.x * aspect * lens, p.y * lens, 1.0));
        ray = vec3(ray.x, cos(pitch)*ray.y + sin(pitch)*ray.z, -sin(pitch)*ray.y + cos(pitch)*ray.z);
        ray = vec3(cos(yaw)*ray.x + sin(yaw)*ray.z, ray.y, -sin(yaw)*ray.x + cos(yaw)*ray.z);
        vec2 uv = vec2(atan(ray.x, ray.z) / 6.28318530718 + 0.5, asin(clamp(ray.y, -1.0, 1.0)) / 3.14159265359 + 0.5);
        gl_FragColor = mix(texture2D(imageA, uv), texture2D(imageB, uv), blend);
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene(); scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  const images = new Map<MomentId, THREE.Texture>();
  const failedImages = new Set<MomentId>();
  const textures = new Set<THREE.Texture>([placeholder]);
  let disposed = false, visible = true, raf = 0, frames = 0, pending = 3, errors = 0;
  let selected: MomentId = '632', current: MomentId | null = null, animateSelection = false;
  let transition: { start: number; target: MomentId } | null = null;

  function request() { if (!disposed && !raf && visible && !document.hidden) raf = requestAnimationFrame(render); }
  function finish() {
    if (!transition) return;
    current = transition.target; uniforms.imageA.value = uniforms.imageB.value;
    uniforms.blend.value = 0; transition = null;
  }
  function showSelected() {
    const image = images.get(selected);
    if (!image || disposed) return;
    finish();
    if (current === null || !animateSelection || !visible || document.hidden) {
      uniforms.imageA.value = image; uniforms.imageB.value = image; uniforms.blend.value = 0; current = selected;
    } else if (current !== selected) {
      uniforms.imageB.value = image; transition = { start: performance.now(), target: selected };
    }
    request();
  }
  function render(now: number) {
    raf = 0;
    if (disposed || document.hidden || !visible) return;
    if (transition) {
      const t = Math.min((now - transition.start) / 1100, 1);
      uniforms.blend.value = t * t * (3 - 2 * t);
      if (t === 1) finish();
    }
    renderer.info.reset(); renderer.render(scene, camera);
    canvas.dataset.frames = String(++frames);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    if (transition) request();
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false); uniforms.aspect.value = width / height; request();
  });
  resize.observe(container);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(raf); raf = 0; finish(); } else request();
  });
  intersection.observe(container);
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; finish(); } else request();
  }
  document.addEventListener('visibilitychange', visibility);
  let pointer: { id: number; x: number; y: number } | null = null;
  function down(event: PointerEvent) {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    uniforms.yaw.value = THREE.MathUtils.clamp(uniforms.yaw.value - (event.clientX - pointer.x) * .0035, -1.05, 1.05);
    if (event.pointerType !== 'touch') uniforms.pitch.value = THREE.MathUtils.clamp(uniforms.pitch.value + (event.clientY - pointer.y) * .0035, -.32, .42);
    pointer.x = event.clientX; pointer.y = event.clientY; request();
  }
  function up() { pointer = null; }
  function lost(event: Event) { event.preventDefault(); if (!disposed) onLost(); }
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('webglcontextlost', lost);

  const loader = new THREE.TextureLoader();
  for (const id of ['632', '661', '680'] as const) {
    const texture = loader.load(`${import.meta.env.BASE_URL}assets/courtyard-${id}.webp`, image => {
      if (disposed) { image.dispose(); return; }
      image.colorSpace = THREE.SRGBColorSpace;
      image.minFilter = THREE.LinearFilter; image.magFilter = THREE.LinearFilter; image.generateMipmaps = false;
      images.set(id, image); pending--;
      canvas.dataset.assets = pending === 0 ? (errors ? 'degraded' : 'ready') : 'loading';
      if (id === selected) showSelected();
      request();
    }, undefined, () => {
      if (disposed) return;
      errors++; pending--; failedImages.add(id);
      canvas.dataset.assets = pending === 0 ? 'degraded' : 'loading';
      if (selected === id) onLost();
    });
    textures.add(texture);
  }
  request();
  return {
    select(id, animate) {
      selected = id; animateSelection = animate; canvas.dataset.moment = id;
      if (failedImages.has(id)) { onLost(); return; }
      showSelected();
    },
    skip() { animateSelection = false; finish(); showSelected(); request(); },
    view(direction) {
      if (direction === 'reset') { uniforms.yaw.value = 0; uniforms.pitch.value = 0; }
      if (direction === 'left') uniforms.yaw.value = Math.max(-1.05, uniforms.yaw.value - .14);
      if (direction === 'right') uniforms.yaw.value = Math.min(1.05, uniforms.yaw.value + .14);
      if (direction === 'up') uniforms.pitch.value = Math.min(.42, uniforms.pitch.value + .1);
      if (direction === 'down') uniforms.pitch.value = Math.max(-.32, uniforms.pitch.value - .1);
      request();
    },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); resize.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('webglcontextlost', lost);
      geometry.dispose(); material.dispose(); textures.forEach(texture => texture.dispose());
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); scene.clear();
    },
  };
}
