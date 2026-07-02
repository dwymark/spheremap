// Mollweide (Homolographic) - Snyder p. 249-251.
// Forward: (31-1) 2*theta + sin(2*theta) = pi * sin(phi), Newton-Raphson;
//          (31-2) x = (2*sqrt(2)/pi) * (lambda-lambda0) * cos(theta)
//          (31-3) y = sqrt(2) * sin(theta)
// Inverse: (31-5) theta = asin(y/sqrt(2))
//          (31-6) phi   = asin((2*theta + sin(2*theta)) / pi)
//          (31-7) lambda = lambda0 + pi*x / (2*sqrt(2)*cos(theta))

import { PI, HALF_PI } from './base.js';

const S2 = Math.SQRT2;
const AXMAX = 2 * S2;
const AYMAX = S2;

export const mollweide = {
  id: 'mollweide',
  name: 'Mollweide',
  aka: 'Homolographic',
  property: 'equal-area',
  family: 'pseudocylindrical',
  description: 'Equal-area pseudocylindrical. Whole world in a 2:1 ellipse via a Newton-Raphson auxiliary angle.',
  snyder: 'Snyder p.249-251, eqs (31-1)-(31-7)',

  parameters: [],
  defaults: { phi0: 0, lambda0: 0 },

  bounds() { return { xmin: -AXMAX, xmax: AXMAX, ymin: -AYMAX, ymax: AYMAX }; },

  forward(phi, lambda, p) {
    let theta = phi;
    for (let i = 0; i < 30; i++) {
      const num = 2*theta + Math.sin(2*theta) - PI*Math.sin(phi);
      const den = 2 + 2*Math.cos(2*theta);
      if (Math.abs(den) < 1e-12) break;
      const d = num / den;
      theta -= d;
      if (Math.abs(d) < 1e-10) break;
    }
    const x = (2*S2/PI) * (lambda - p.lambda0) * Math.cos(theta);
    const y = S2 * Math.sin(theta);
    return [x, y, 1];
  },

  inverse(x, y, p) {
    const s = y / S2;
    if (Math.abs(s) > 1) return [0, 0, 0];
    const theta = Math.asin(s);
    const arg = (2*theta + Math.sin(2*theta)) / PI;
    if (Math.abs(arg) > 1) return [0, 0, 0];
    const phi = Math.asin(arg);
    const cos_t = Math.cos(theta);
    const lam = p.lambda0 + PI * x / (2 * S2 * cos_t);
    const inside = (x*x)/(8) + (y*y)/(2) <= 1 + 1e-4;
    return [phi, lam, inside ? 1 : 0];
  },

  glslInverse: `
    vec3 inverseProject(vec2 xy, vec4 p) {
      float S2v = 1.41421356;
      float s   = xy.y / S2v;
      if (abs(s) > 1.0) return vec3(0.0);
      float theta = asin(s);
      float arg   = (2.0*theta + sin(2.0*theta)) / PI_;
      if (abs(arg) > 1.0) return vec3(0.0);
      float phi    = asin(arg);
      float ct     = cos(theta);
      float lambda = p.y + PI_ * xy.x / (2.0 * S2v * ct);
      float ellipse = (xy.x*xy.x)/8.0 + (xy.y*xy.y)/2.0;
      float valid = ellipse <= 1.0 + 1e-4 ? 1.0 : 0.0;
      return vec3(phi, lambda, valid);
    }
  `,
};
