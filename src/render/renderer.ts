import * as THREE from 'three/webgpu';

/** Probe the texture view call used by three r186 before selecting WebGPU. */
async function webgpuUsable(): Promise<boolean> {
  // Keep the probe local rather than adding @webgpu/types to the project.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpu = (navigator as any).gpu;
  if (!gpu) return false;

  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    try {
      const texture = device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: 0x04, // GPUTextureUsage.TEXTURE_BINDING
      });
      try {
        texture.createView({ swizzle: 'rgba' });
        return true;
      } finally {
        texture.destroy();
      }
    } finally {
      device.destroy();
    }
  } catch {
    return false;
  }
}

export async function createRenderer(opts: { antialias: boolean; forceWebGL: boolean }) {
  const forceWebGL = opts.forceWebGL || !(await webgpuUsable());
  const renderer = new THREE.WebGPURenderer({ antialias: opts.antialias, forceWebGL });
  try {
    await renderer.init();
  } catch (error) {
    try { renderer.dispose(); } catch { /* Initialization may not have completed. */ }
    throw error;
  }
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
    ? 'WebGPU'
    : 'WebGL2 fallback';
  return { renderer, backend };
}
