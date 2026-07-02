// Azimuthal Equidistant - Snyder p. 195-196, eqs (25-2),(25-3),(25-4)
// forward with (5-3) for c; (20-14)-(20-19) inverse with (25-15) for c.
// Sphere. Distances and azimuths from the center are true.

import { PI, HALF_PI, wrapDelta } from './base.js';

export const azimuthalEquidistant = {
  id: 'azimuthal-equidistant',
  name: 'Azimuthal Equidistant',
  property: 'equidistant',
  family: 'azimuthal',
  description: 'True great-circle distance and azimuth from the center. Whole sphere in a disk.',
  snyder: 'Snyder p.195-196, eqs (25-2)-(25-4),(20-14)-(20-19),(25-15)',

  parameters: [
    { key: 'phi1', label: 'Center latitude', min: -90, max: 90, step: 0.5, default: 90, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -PI, xmax: PI, ymin: -PI, ymax: PI }; },

  forward(phi, lambda, p) {
    const dl = wrapDelta(lambda, p.lambda0);
    const cosc = Math.sin(p.phi1)*Math.sin(phi) + Math.cos(p.phi1)*Math.cos(phi)*Math.cos(dl);
    const c = Math.acos(Math.max(-1, Math.min(1, cosc)));
    const k = c === 0 ? 1 : c / Math.sin(c);
    return [
      k * Math.cos(phi) * Math.sin(dl),
      k * (Math.cos(p.phi1)*Math.sin(phi) - Math.sin(p.phi1)*Math.cos(phi)*Math.cos(dl)),
      1,
    ];
  },

  inverse(x, y, p) {
    const rho = Math.hypot(x, y);
    if (rho > PI) return [0, 0, 0];
    const c = rho;
    const sinc = Math.sin(c), cosc = Math.cos(c);
    const sinp1 = Math.sin(p.phi1), cosp1 = Math.cos(p.phi1);
    let phi, lam;
    if (rho < 1e-9) { phi = p.phi1; lam = p.lambda0; }
    else {
      phi = Math.asin(cosc*sinp1 + y*sinc*cosp1/rho);
      lam = p.lambda0 + Math.atan2(x*sinc, rho*cosp1*cosc - y*sinp1*sinc);
    }
    return [phi, lam, 1];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      float rho = length(xy);
      if (rho > PI_) return vec3(0.0);
      float c = rho;
      float sinc = sin(c), cosc = cos(c);
      float sinp1 = sin(p.z), cosp1 = cos(p.z);
      float phi, lambda;
      if (rho < 1e-6) { phi = p.z; lambda = p.y; }
      else {
        phi    = asin(cosc*sinp1 + xy.y*sinc*cosp1/rho);
        lambda = p.y + atan(xy.x*sinc, rho*cosp1*cosc - xy.y*sinp1*sinc);
      }
      return vec3(phi, lambda, 1.0);
    }
  `,
};
