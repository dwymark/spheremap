// src/projections/base.js
//
// Base helpers and the projection interface contract.
//
// Every projection module exports a Projection object:
//
//   {
//     id, name, aka?, property, family, description, snyder,
//     parameters: [{ key, label, min, max, step, default, unit? }, ...],
//     defaults:   { phi0, lambda0 },
//     bounds(params)                    -> { xmin, xmax, ymin, ymax }
//     forward(phi, lambda, params)      -> [x, y, valid]
//     inverse(x, y, params)             -> [phi, lambda, valid]
//     glslInverse: string   // vec3 inverseProject(vec2 xy, vec4 p)
//                           // where p = vec4(phi0, lambda0, phi1, phi2)
//                           // returning vec3(phi, lambda, valid)
//   }

export const PI = Math.PI;
export const HALF_PI = Math.PI / 2;
export const TWO_PI = 2 * Math.PI;
export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

// Wrap (lambda - lambda0) into (-pi, +pi] as Snyder requires (p. 30).
export function wrapDelta(lam, lam0) {
  let d = lam - lam0;
  while (d > PI) d -= TWO_PI;
  while (d <= -PI) d += TWO_PI;
  return d;
}

// Resolve a params object, filling in projection-specific defaults.
export function resolveParams(projection, userParams) {
  const p = { ...projection.defaults };
  for (const spec of projection.parameters) {
    p[spec.key] = (userParams && userParams[spec.key] !== undefined)
      ? userParams[spec.key]
      : spec.default;
  }
  if (userParams) {
    if (userParams.phi0    !== undefined) p.phi0    = userParams.phi0;
    if (userParams.lambda0 !== undefined) p.lambda0 = userParams.lambda0;
  }
  return p;
}

// Fixed uniform packing: vec4(phi0, lambda0, phi1, phi2).
export function packUniform(params) {
  return new Float32Array([
    params.phi0    ?? 0,
    params.lambda0 ?? 0,
    params.phi1    ?? 0,
    params.phi2    ?? 0,
  ]);
}
