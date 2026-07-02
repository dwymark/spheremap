// Mercator - Snyder p. 44-45, eqs (7-1),(7-2) forward; (7-4),(7-5) inverse.
// Sphere. The classic conformal cylindrical: rhumbs are straight lines,
// poles are pushed to infinity. We clip y at |phi| ~ 85 deg to keep the
// map finite.

import { PI, HALF_PI, wrapDelta } from './base.js';

const CLIP = 85 * Math.PI / 180;
const YMAX = Math.log(Math.tan(PI/4 + CLIP/2));

export const mercator = {
  id: 'mercator',
  name: 'Mercator',
  property: 'conformal',
  family: 'cylindrical',
  description: 'Conformal cylindrical. Angles and shapes locally preserved; area badly distorted near the poles.',
  snyder: 'Snyder p.44-45, eqs (7-1),(7-2),(7-4),(7-5)',

  parameters: [],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -PI, xmax: PI, ymin: -YMAX, ymax: YMAX }; },

  forward(phi, lambda, p) {
    if (Math.abs(phi) > CLIP) return [0, 0, 0];
    return [wrapDelta(lambda, p.lambda0),
            Math.log(Math.tan(PI/4 + phi/2)),
            1];
  },

  inverse(x, y, p) {
    const phi = HALF_PI - 2 * Math.atan(Math.exp(-y));
    return [phi, x + p.lambda0, 1];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      float phi    = HALF_PI - 2.0 * atan(exp(-xy.y));
      float lambda = xy.x + p.y;
      return vec3(phi, lambda, 1.0);
    }
  `,
};
