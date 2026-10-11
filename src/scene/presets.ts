import type { MomentId } from '../state';
export interface LightPreset { position: [number, number, number]; color: number; intensity: number; sky: number }
export const presets: Record<MomentId, LightPreset> = {
  '632': { position: [-6, 10, 5], color: 0xffe4bc, intensity: 3.0, sky: 0xc4decc },
  '661': { position: [7, 8, 2], color: 0xffe7bf, intensity: 2.8, sky: 0xb4d2ca },
  '680': { position: [-7, 5, -3], color: 0xffd8b0, intensity: 2.2, sky: 0xc4c8be },
};
