// Orthographic - Snyder p. 149-150, eqs (20-3),(20-4) forward;
// (20-14)-(20-19) inverse. Sphere.

import { PI, HALF_PI, wrapDelta } from './base.js';

export const orthographic = {
  id: 'orthographic',
  name: 'Orthographic',
  property: 'compromise',
  family: 'azimuthal',
  description: 'Perspective from infinity. One hemisphere visible; the sphere as through a telescope.',
  snyder: 'Snyder p.149-150, eqs (20-3),(20-4),(20-14)-(20-19)',

  parameters: [
    { key: 'phi1', label: 'Center latitude',  min: -90, max: 90,  step: 0.5, default: 0, unit: 'deg' },
  ],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -1, xmax: 1, ymin: -1, ymax: 1 }; },

  forward(phi, lambda, p) {
    const dl = wrapDelta(lambda, p.lambda0);
    const cosc = Math.sin(p.phi1)*Math.sin(phi) + Math.cos(p.phi1)*Math.cos(phi)*Math.cos(dl);
    if (cosc < 0) return [0, 0, 0];
    return [
      Math.cos(phi)*Math.sin(dl),
      Math.cos(p.phi1)*Math.sin(phi) - Math.sin(p.phi1)*Math.cos(phi)*Math.cos(dl),
      1,
    ];
  },

  inverse(x, y, p) {
    const rho = Math.hypot(x, y);
    if (rho > 1) return [0, 0, 0];
    const c = Math.asin(rho);
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
      if (rho > 1.0) return vec3(0.0);
      float c = asin(min(rho, 1.0));
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
