# Wedding story

Run from this folder with `python -m http.server 8000`, then open `http://localhost:8000`.

Section 2 uses a transparent-sky cutout derived from the supplied temple photograph. The untouched original remains at `images/scene-02.png`; `node tools/create-temple-cutout.js` recreates `images/scene-02-cutout.png` with the original temple pixels and a transparent sky. The last moving cloud frame sits behind that cutout when Section 2 arrives, creating one continuous cloud-to-temple composition. Section 1 itself shows clouds only.

Add the remaining supplied photographs at these paths, or update their matching `src` values in `index.html`:

- `images/scene-03.jpg`
- `images/scene-04.jpg`
- `images/scene-05.jpg`
- `images/scene-06.jpg`

Set the invitation link by replacing `WEDDING_INVITATION_URL` in `index.html`. Each photo scene can use `--focus: 55% 42%` on its `<section>` to fine-tune `object-position` for its photograph. The opening cloud scene is a procedural WebGL shader; it stops rendering and releases its WebGL context after the viewer scrolls past it. The rest of the story uses photographs and CSS transitions only.
