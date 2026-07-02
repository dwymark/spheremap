// Lambert Cylindrical Equal-Area - Snyder p. 76-77, eqs (10-1),(10-2)
// forward; (10-3),(10-4) inverse. Sphere.
//   x = (lambda - lambda0) * cos(phi_s)
//   y = sin(phi) / cos(phi_s)

import { PI, wrapDelta } from './base.js';

export const cylindricalEqualArea = {
  id: 'cylindrical-equal-area',
  name: 'Cylindrical Equal-Area',
  aka: 'Lambert',
  property: 'equal-area',
  family: 'cylindrical',
  description: 'Equal-area cylindrical. Latitudes crowded at the poles to compensate for the equator stretching.',
  snyder: 'Snyder p.76-77, eqs (10-1)-(10-4)',

  parameters: [
    { key: 'phi1', label: 'Standard parallel', min: 0, max: 75, step: 0.5, default: 0, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds(p) {
    const cs = Math.cos(p.phi1);
    return {
      xmin: -PI * cs, xmax: PI * cs,
      ymin: -1 / cs,  ymax: 1 / cs,
    };
  },

  forward(phi, lambda, p) {
    const cs = Math.cos(p.phi1);
    return [wrapDelta(lambda, p.lambda0) * cs, Math.sin(phi) / cs, 1];
  },

  inverse(x, y, p) {
    const cs = Math.cos(p.phi1);
    const arg = y * cs;
    if (Math.abs(arg) > 1) return [0, 0, 0];
    return [Math.asin(arg), x / cs + p.lambda0, 1];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      float cs  = cos(p.z);
      if (abs(cs) < 1e-6) return vec3(0.0);
      float arg = xy.y * cs;
      if (abs(arg) > 1.0) return vec3(0.0);
      float phi    = asin(arg);
      float lambda = xy.x / cs + p.y;
      return vec3(phi, lambda, 1.0);
    }
  `,
};
