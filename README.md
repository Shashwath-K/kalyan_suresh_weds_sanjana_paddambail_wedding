# Wedding story

Run from this folder with `python -m http.server 8000`, then open `http://localhost:8000`.

The six-scene story uses a live cloud layer through the transparent sky in Section 2, then releases its WebGL context after the temple scene. The deployed page uses optimized WebP renditions for the temple, groom, bride, and couple photographs. Original camera JPEGs and the full-resolution AI-enhanced PNG remain local and are ignored by Git; the shipped WebP assets are tracked.

`images/scene-02.png` remains as the source for `node tools/create-temple-cutout.js`. The WebP display assets are generated at 2560px maximum dimension with high quality, retaining alpha for the temple cutout. Set ceremony timings, venue details, and the map URL in Section 6 of `index.html` when they are available. Each photo scene can use `--focus` on its `<section>` to fine-tune `object-position`.
