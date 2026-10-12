# Photographic courtyard

The photographs on the page are renders of an invented courtyard. They do not document an actual building, archaeological site, or historical event. The scene remains free of historical figures, inscriptions, domes, minarets, and simulated violence.

The opening and every dated interactive view use the same detailed scene. The foliage has curved stems and tapered leaflets; the earth walls have worn edges; individual wood poles and roof stalks cast shadows. Poly Haven scans supply plaster, sand, bark, and wood surfaces. Cycles renders direct light, occlusion, and bounced light before the images are delivered to the browser.

## Render inputs and tools

- Scene source: `scripts/render-courtyard.py`, deterministic geometry seed 632.
- Local CC0 inputs: `public/assets/polyhaven/`; creator and source records are in `content/assets.json`.
- Blender 4.3.2 with Cycles CPU rendering, AgX color management, 64 samples for the opening image and 48 for panoramas, with adaptive sampling.
- Intel Open Image Denoise 2.5.1, official [RenderKit release](https://github.com/RenderKit/oidn/releases/tag/v2.5.1), and ImageMagick for the linear-light PFM and WebP pipeline in `scripts/process-render.py`.

The installed Blender build does not include its own OpenImageDenoise support. The separate OIDN executable denoises the rendered images. It is an authoring tool, not a runtime site dependency.

## Reproduce

Run from the repository root. Supply the path to an installed `oidnDenoise` executable:

```sh
blender -b -t 5 -P scripts/render-courtyard.py -- hero 632
python3 scripts/process-render.py work/renders/hero-632.png public/assets/courtyard-hero.webp --oidn /path/to/oidnDenoise

blender -b -t 5 -P scripts/render-courtyard.py -- panorama 632
python3 scripts/process-render.py work/renders/panorama-632.png public/assets/courtyard-632.webp --oidn /path/to/oidnDenoise
```

Repeat the panorama commands for `661` and `680`. `preview` renders a smaller perspective image for checking changes before full rendering. Intermediate PNG, PFM, and Blender files are written under ignored `work/renders/`.

The reading and unavailable-WebGL view also has a perspective still for each later date. Render `hero 661` and `hero 680` with the same Blender command, then process their PNGs to `public/assets/courtyard-661-still.webp` and `public/assets/courtyard-680-still.webp`.

The opening and dated reading images are 1920 × 1200. Each panorama is 3072 × 1536. The browser projects the panoramas from one fixed location, allowing limited horizontal and vertical looking. It does not perform camera translation or reconstruct depth from a photograph. Date changes crossfade the separate lighting renders; geometry remains the same.

The source texture files remain available in the repository and static build for reproduction. The browser loads only the final photographs, fonts, and local code. Rendering stops when idle, offscreen, or in a background tab. An image request failure or unavailable WebGL returns the complete reading experience with a still image.
