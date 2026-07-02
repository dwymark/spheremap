// Spot-check numerical examples from Snyder Appendix A.
// The projection library only implements the sphere formulas; the reference
// values below are chosen to match Snyder's sphere examples.

import { mercator }     from '../src/projections/mercator.js';
import { orthographic } from '../src/projections/orthographic.js';
import { resolveParams } from '../src/projections/base.js';

const D = Math.PI / 180;

function check(label, expected, actual, tol = 1e-4) {
  const err = Math.max(Math.abs(expected[0] - actual[0]),
                       Math.abs(expected[1] - actual[1]));
  const status = err < tol ? 'PASS' : 'FAIL';
  console.log(`${status}  ${label}\n      expected=(${expected[0].toFixed(6)}, ${expected[1].toFixed(6)})\n      got     =(${actual[0].toFixed(6)}, ${actual[1].toFixed(6)})   err=${err.toExponential(2)}`);
}

// Snyder, Mercator (sphere), Appendix A p. 269.
// phi=35 deg N, lambda=75 deg W, lambda0=0. R=1.
// x = -1.3089969, y = 0.6528366.
{
  const p = resolveParams(mercator, {});
  const [x, y] = mercator.forward(35*D, -75*D, p);
  check('Mercator (35N, 75W)', [-1.3089969, 0.6528366], [x, y]);
}

// Snyder, Orthographic (sphere), Appendix A oblique aspect.
// phi1=40 deg N, lambda0=-100 deg, phi=30 deg N, lambda=-110 deg.
// x = -0.1503837, y = -0.1651911 (matches the closed-form (20-3),(20-4)).
{
  const params = resolveParams(orthographic, {
    phi0: 0, lambda0: -100*D, phi1: 40*D,
  });
  const [x, y] = orthographic.forward(30*D, -110*D, params);
  check('Orthographic oblique (40N,100W center; 30N,110W)',
        [-0.1503837, -0.1651911], [x, y]);
}
