// Lambert Azimuthal Equal-Area - Snyder p. 185-186, eqs (24-2),(24-3),(24-4)
// forward; (24-15)-(24-17) inverse. Sphere. Whole sphere in a disk of
// radius 2; area preserved everywhere.

import { PI, HALF_PI, wrapDelta } from './base.js';

const R_LAEA = 2;

export const lambertAzimuthalEqualArea = {
  id: 'lambert-azimuthal-equal-area',
  name: 'Lambert Azimuthal Equal-Area',
  property: 'equal-area',
  family: 'azimuthal',
  description: 'Equal-area azimuthal. Whole sphere in a disk of radius 2.',
  snyder: 'Snyder p.185-186, eqs (24-2)-(24-4),(24-15)-(24-17)',

  parameters: [
    { key: 'phi1', label: 'Center latitude', min: -90, max: 90, step: 0.5, default: 0, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -R_LAEA, xmax: R_LAEA, ymin: -R_LAEA, ymax: R_LAEA }; },

  forward(phi, lambda, p) {
    const dl = wrapDelta(lambda, p.lambda0);
    const denom = 1 + Math.sin(p.phi1)*Math.sin(phi) + Math.cos(p.phi1)*Math.cos(phi)*Math.cos(dl);
    if (denom <= 1e-6) return [0, 0, 0];
    const k = Math.sqrt(2 / denom);
    return [
      k * Math.cos(phi) * Math.sin(dl),
      k * (Math.cos(p.phi1)*Math.sin(phi) - Math.sin(p.phi1)*Math.cos(phi)*Math.cos(dl)),
      1,
    ];
  },

  inverse(x, y, p) {
    const rho = Math.hypot(x, y);
    if (rho > R_LAEA) return [0, 0, 0];
    const c = 2 * Math.asin(rho / 2);
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
      if (rho > 2.0) return vec3(0.0);
      float c = 2.0 * asin(min(rho / 2.0, 1.0));
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
