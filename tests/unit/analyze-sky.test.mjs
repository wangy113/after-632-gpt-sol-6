import { describe, expect, it } from 'vitest';
import { analyzeSkyPixels } from '../../scripts/analyze-sky.mjs';

function syntheticSky(peakX, peakY, peakColor) {
  const width = 4;
  const height = 4;
  const data = new Float32Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    data.set([0.2, 0.2, 0.2, 1], pixel * 4);
  }
  data.set([...peakColor, 1], (peakY * width + peakX) * 4);
  return { data, width, height };
}

describe('offline sky analysis', () => {
  it('maps a bright pixel to Three equirectangular world direction and unit-luminance color', () => {
    const result = analyzeSkyPixels(syntheticSky(2, 1, [120, 100, 80]));
    expect(result.peak).toEqual([2, 1]);
    expect(result.direction[0]).toBeCloseTo(Math.cos(Math.PI / 8) / Math.SQRT2);
    expect(result.direction[1]).toBeCloseTo(Math.sin(Math.PI / 8));
    expect(result.direction[2]).toBeCloseTo(Math.cos(Math.PI / 8) / Math.SQRT2);
    const brightness = result.color[0] * 0.2126
      + result.color[1] * 0.7152 + result.color[2] * 0.0722;
    expect(brightness).toBeCloseTo(1);
    expect(result.color[0]).toBeGreaterThan(result.color[1]);
    expect(result.color[1]).toBeGreaterThan(result.color[2]);
  });

  it('flips the file row and panorama side into the correct world quadrants', () => {
    const result = analyzeSkyPixels(syntheticSky(1, 2, [40, 40, 40]));
    expect(result.direction[0]).toBeGreaterThan(0);
    expect(result.direction[1]).toBeLessThan(0);
    expect(result.direction[2]).toBeLessThan(0);
  });

  it('rejects a dark sky without a solar peak', () => {
    expect(() => analyzeSkyPixels(syntheticSky(0, 0, [2, 2, 2])))
      .toThrow('Sky has no bright sun peak');
  });
});
