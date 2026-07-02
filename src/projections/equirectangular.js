// Equirectangular / Plate Carree - Snyder p. 90-91, eqs (12-1),(12-2).
// Sphere only. Simplest of all projections: latitude scaled linearly to y,
// longitude scaled linearly to x with a cos(phi1) factor for the standard
// parallel. When phi1 = 0 this is the Plate Carree.

import { PI, HALF_PI, wrapDelta } from './base.js';

export const equirectangular = {
  id: 'equirectangular',
  name: 'Equirectangular',
  aka: 'Plate Carree',
  property: 'equidistant',
  family: 'cylindrical',
  description: 'Latitude and longitude scaled linearly. True scale along the standard parallel and every meridian.',
  snyder: 'Snyder p.90-91, eqs (12-1)-(12-2)',

  parameters: [
    { key: 'phi1', label: 'Standard parallel', min: -85, max: 85, step: 0.5, default: 0, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds(params) {
    const c = Math.cos(params.phi1);
    return { xmin: -PI * c, xmax: PI * c, ymin: -HALF_PI, ymax: HALF_PI };
  },

  forward(phi, lambda, p) {
    return [wrapDelta(lambda, p.lambda0) * Math.cos(p.phi1), phi, 1];
  },

  inverse(x, y, p) {
    const c = Math.cos(p.phi1);
    if (c === 0) return [0, 0, 0];
    return [y, x / c + p.lambda0, 1];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      float c = cos(p.z);
      if (abs(c) < 1e-6) return vec3(0.0, 0.0, 0.0);
      float phi    = xy.y;
      float lambda = xy.x / c + p.y;
      float valid  = (abs(phi) <= HALF_PI + 1e-4) ? 1.0 : 0.0;
      return vec3(phi, lambda, valid);
    }
  `,
};
