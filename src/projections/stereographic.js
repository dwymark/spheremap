// Stereographic - Snyder p. 157-158, eqs (21-2),(21-3),(21-4) forward;
// (20-14)-(20-19) inverse with (21-15) for c. Sphere.

import { PI, HALF_PI, wrapDelta } from './base.js';

const R_STEREO = 3;

export const stereographic = {
  id: 'stereographic',
  name: 'Stereographic',
  property: 'conformal',
  family: 'azimuthal',
  description: 'Conformal perspective from the antipode. Whole sphere except one point; great circles map to circles.',
  snyder: 'Snyder p.157-158, eqs (21-2)-(21-4),(20-14)-(20-19),(21-15)',

  parameters: [
    { key: 'phi1', label: 'Center latitude', min: -90, max: 90, step: 0.5, default: 0, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -R_STEREO, xmax: R_STEREO, ymin: -R_STEREO, ymax: R_STEREO }; },

  forward(phi, lambda, p) {
    const dl = wrapDelta(lambda, p.lambda0);
    const k = 2 / (1 + Math.sin(p.phi1)*Math.sin(phi) + Math.cos(p.phi1)*Math.cos(phi)*Math.cos(dl));
    return [
      k * Math.cos(phi) * Math.sin(dl),
      k * (Math.cos(p.phi1)*Math.sin(phi) - Math.sin(p.phi1)*Math.cos(phi)*Math.cos(dl)),
      1,
    ];
  },

  inverse(x, y, p) {
    const rho = Math.hypot(x, y);
    if (rho > R_STEREO) return [0, 0, 0];
    const c = 2 * Math.atan(rho / 2);
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
      float c = 2.0 * atan(rho / 2.0);
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
