// Demo entry point. Wires the projection library, the WebGL renderer, and
// the controls panel. This is the only place the three concerns meet.

import { WebGLRenderer } from '../src/renderer/webgl.js';
import { projections, getProjection } from '../src/projections/index.js';
import { resolveParams } from '../src/projections/base.js';
import { buildControls }  from '../src/ui/controls.js';

function boot() {
  const canvas = document.getElementById('map');
  const renderer = new WebGLRenderer(canvas);

  // Application model: which projection, and its resolved params.
  const state = {
    projection: getProjection('mollweide'),
    params: null,
  };
  state.params = resolveParams(state.projection, {});

  function render() { renderer.render(); }

  const handles = buildControls({
    container: document.getElementById('controls'),
    initial: { projectionId: state.projection.id },
    onChange(patch) {
      if (patch.projection) {
        state.projection = patch.projection;
        state.params = resolveParams(state.projection, state.params);
        renderer.setProjection(state.projection);
        renderer.setParams(state.params);
        updateStatus();
        render();
        return;
      }
      // Field / render-side patches
      let dirty = false;
      if (patch.noiseFreq !== undefined) { renderer.setNoise(patch.noiseFreq, renderer.noise.amp); dirty = true; }
      if (patch.noiseAmp  !== undefined) { renderer.setNoise(renderer.noise.freq, patch.noiseAmp); dirty = true; }
      if (patch.bandLow  !== undefined || patch.bandHigh !== undefined) {
        renderer.setBand(
          patch.bandLow  !== undefined ? patch.bandLow  : renderer.band.low,
          patch.bandHigh !== undefined ? patch.bandHigh : renderer.band.high,
        );
        dirty = true;
      }
      // Projection param patches
      const proj = state.projection;
      const knownKeys = ['phi0', 'lambda0', ...proj.parameters.map(s => s.key)];
      for (const k of knownKeys) {
        if (patch[k] !== undefined) { state.params[k] = patch[k]; dirty = true; }
      }
      if (dirty) {
        renderer.setParams(state.params);
        updateStatus();
        render();
      }
    },
  });

  function updateStatus() {
    const p = state.projection, pr = state.params;
    const rad2deg = (r) => (r * 180 / Math.PI).toFixed(1);
    const bits = [
      `${p.name}`,
      `phi0=${rad2deg(pr.phi0)}°`,
      `lambda0=${rad2deg(pr.lambda0)}°`,
    ];
    if (pr.phi1 !== undefined && p.parameters.some(s => s.key === 'phi1')) {
      bits.push(`phi1=${rad2deg(pr.phi1)}°`);
    }
    document.getElementById('status-projection').textContent = bits.join('  |  ');
  }

  // resize
  const onResize = () => { renderer.resize(); render(); };
  window.addEventListener('resize', onResize);

  renderer.resize();
  renderer.setProjection(state.projection);
  renderer.setParams(state.params);
  updateStatus();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
