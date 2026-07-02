// Sinusoidal (Sanson-Flamsteed) - Snyder p. 243-244, eqs (30-1),(30-2)
// forward; (30-6),(30-7) inverse. Sphere. Equal-area pseudocylindrical.

import { PI, HALF_PI, wrapDelta } from './base.js';

export const sinusoidal = {
  id: 'sinusoidal',
  name: 'Sinusoidal',
  aka: 'Sanson-Flamsteed',
  property: 'equal-area',
  family: 'pseudocylindrical',
  description: 'Equal-area pseudocylindrical. Straight equally-spaced parallels, sinusoidal meridians.',
  snyder: 'Snyder p.243-244, eqs (30-1),(30-2),(30-6),(30-7)',

  parameters: [],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -PI, xmax: PI, ymin: -HALF_PI, ymax: HALF_PI }; },

  forward(phi, lambda, p) {
    return [wrapDelta(lambda, p.lambda0) * Math.cos(phi), phi, 1];
  },

  inverse(x, y, p) {
    if (Math.abs(y) > HALF_PI) return [0, 0, 0];
    const c = Math.cos(y);
    if (c === 0) return [y, p.lambda0, 1];
    const lam = x / c + p.lambda0;
    const valid = Math.abs(x) <= PI * c + 1e-6 ? 1 : 0;
    return [y, lam, valid];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      if (abs(xy.y) > HALF_PI) return vec3(0.0);
      float c = cos(xy.y);
      float valid = (abs(xy.x) <= PI_ * c + 1e-4) ? 1.0 : 0.0;
      float lambda = (abs(c) < 1e-6) ? p.y : xy.x / c + p.y;
      return vec3(xy.y, lambda, valid);
    }
  `,
};
