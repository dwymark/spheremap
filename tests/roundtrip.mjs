// Round-trip test: for each projection, sample points and check
// inverse(forward(phi,lambda)) ~ (phi,lambda) up to wrapping.

import { projections } from '../src/projections/index.js';
import { resolveParams, wrapDelta } from '../src/projections/base.js';

const DEG = Math.PI/180;

function testProj(p) {
  const params = resolveParams(p, {});
  // Sample points -- avoid poles and boundaries.
  const samples = [];
  for (let phiDeg = -80; phiDeg <= 80; phiDeg += 20) {
    for (let lamDeg = -170; lamDeg <= 170; lamDeg += 40) {
      samples.push([phiDeg*DEG, lamDeg*DEG]);
    }
  }
  let ok = 0, fail = 0, invalid = 0;
  let maxErr = 0;
  for (const [phi, lam] of samples) {
    const [x, y, fv] = p.forward(phi, lam, params);
    if (!fv) { invalid++; continue; }
    const [phi2, lam2, iv] = p.inverse(x, y, params);
    if (!iv) { invalid++; continue; }
    const dphi = Math.abs(phi - phi2);
    const dlam = Math.abs(wrapDelta(lam2, lam));
    const err = Math.max(dphi, dlam);
    maxErr = Math.max(maxErr, err);
    if (err < 1e-6) ok++;
    else fail++;
  }
  return { ok, fail, invalid, maxErr };
}

for (const p of projections) {
  const r = testProj(p);
  const status = r.fail === 0 ? 'PASS' : 'FAIL';
  console.log(`${status}  ${p.name.padEnd(35)}  ok=${r.ok}  fail=${r.fail}  invalid=${r.invalid}  maxErr=${r.maxErr.toExponential(2)}`);
}
