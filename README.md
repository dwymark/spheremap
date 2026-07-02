**Who wrote this?** *Written by Claude (Anthropic) — the library, the demo, and this README — under the repository owner's direction and review.*

---

# spheremap

A small library of sphere-to-plane map projections, with a WebGL demo to show it off. The GPU inverse-projects every map pixel to a latitude and longitude, then colors that point from a 3D Perlin noise field on the sphere, with latitude driving a blue-to-white mix from equator to pole. The noise samples the true 3D point on the unit sphere, so it stays seamless at the poles and the antimeridian. Ten projections ship, spanning the cylindrical and azimuthal families. The library is the point; the demo is just the showcase.

## Running

The demo is plain ES modules. Serve the folder and open the demo:

```
python3 -m http.server 8080
# then open http://localhost:8080/demo/
```

Or build a single-file bundle and open that in a browser:

```
./build.sh                      # writes dist/index.html
```

The renderer prefers WebGL2 and falls back to WebGL1 on its own, rewriting the shaders as it goes. There are no runtime dependencies.

## Layout

```
src/
  projections/    one file per projection, plus base.js and a registry
  renderer/       WebGL renderer, shader templates, Perlin noise, color
  ui/             control panel, no framework
demo/             index.html, main.js, style.css that wire the three
build.sh          bundle the source into one self-contained HTML file
tests/            Node round-trip and Snyder checks
```

## Building the bundle

build.sh concatenates the ES modules in dependency order, strips the import and export syntax, wraps the result in an IIFE, and inlines the CSS. The output is one self-contained HTML file. It needs only bash, sed, and python3 — no npm, no bundler.

```
./build.sh                      # writes dist/index.html
./build.sh /path/to/out.html    # writes elsewhere
```

## The projection interface

Each projection is one file under src/projections/. It exports a plain object:

```js
export const mercator = {
  id: 'mercator',
  name: 'Mercator',
  property: 'conformal',
  family: 'cylindrical',
  snyder: 'Snyder p.44-45, eqs (7-1),(7-2),(7-4),(7-5)',
  parameters: [],
  defaults: { phi0: 0, lambda0: 0 },
  bounds()                      { return { xmin, xmax, ymin, ymax }; },
  forward(phi, lambda, params)  { return [x, y, valid]; },
  inverse(x, y, params)         { return [phi, lambda, valid]; },
  glslInverse: `vec3 inverseProject(vec2 xy, vec4 p) { ... }`,
};
```

The forward and inverse run in JS, for tests and tools. glslInverse runs on the GPU, one function per projection. Parameters pack into a single vec4: (phi0, lambda0, phi1, phi2). A projection ignores the channels it does not use. A valid of 0 marks a pixel outside the domain, such as the far side of the sphere under orthographic.

## Adding a projection

1. Copy a nearby projection file as a template.
2. Fill in forward, inverse, and glslInverse from Snyder, and cite the equation numbers.
3. Register it in src/projections/index.js.

The renderer, controls, and bundle then pick it up on their own.

## Tests

The library needs no DOM or GL context, so the tests run under Node:

```
node tests/roundtrip.mjs        # inverse(forward(p)) == p, for every projection
node tests/snyder.mjs           # a few Snyder Appendix A reference vectors
```

## Sources

Formulas come from John P. Snyder, *Map Projections — A Working Manual* (USGS Professional Paper 1395, 1987). Each projection file cites its equation numbers. The classic Perlin noise GLSL is adapted from Stefan Gustavson and Ashima Arts, under the MIT license.

## License

Released into the public domain under the Unlicense. See LICENSE.
