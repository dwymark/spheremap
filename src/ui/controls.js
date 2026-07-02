// Control panel construction.
//
// Follows /style visual controls: setting-controls in fixed chrome, each
// showing its own value at rest, one knob per orthogonal axis, stepped
// where stepping serves. The projection choice is a discrete stepped list
// (family-grouped), the parameters are continuous sliders, the noise and
// band controls are continuous.
//
// This module is DOM-only. It does not touch the renderer directly; it
// emits events via a subscriber callback so the demo wires them.

import { projections } from '../projections/index.js';
import { RAD, DEG } from '../projections/base.js';

const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of children) if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
};

// Format a numeric value with unit for the readout beside each slider.
function fmt(value, spec) {
  if (spec.unit === 'deg') return `${value.toFixed(1)}°`;
  if (spec.unit === '')    return `${value.toFixed(2)}`;
  return `${value.toFixed(2)}`;
}

// One labelled slider. Reads its value at rest via the readout at right.
function slider({ id, label, min, max, step, initial, unit = '', onInput }) {
  const readout = el('span', { class: 'ctrl-value' });
  const range = el('input', {
    type: 'range', id, min, max, step, value: initial,
    class: 'ctrl-range',
    oninput: (e) => {
      const v = parseFloat(e.target.value);
      readout.textContent = fmt(v, { unit });
      onInput(v);
    },
  });
  readout.textContent = fmt(initial, { unit });
  const row = el('div', { class: 'ctrl-row' },
    el('label', { for: id, class: 'ctrl-label' }, label),
    readout,
    range,
  );
  return { row, range, readout, set(v) { range.value = v; readout.textContent = fmt(v, { unit }); } };
}

// Build the projection selector — a stepped list grouped by family.
// Radios so it reads as a mutually-exclusive choice at rest.
function projectionList(initialId, onSelect) {
  const groups = {};
  for (const p of projections) {
    (groups[p.family] ??= []).push(p);
  }
  const container = el('div', { class: 'proj-list' });
  const familyOrder = ['cylindrical', 'pseudocylindrical', 'azimuthal', 'perspective'];
  for (const fam of familyOrder) {
    if (!groups[fam]) continue;
    container.appendChild(el('h3', { class: 'proj-family' }, fam));
    for (const p of groups[fam]) {
      const input = el('input', {
        type: 'radio', name: 'projection', id: `proj-${p.id}`, value: p.id,
      });
      if (p.id === initialId) input.checked = true;
      input.addEventListener('change', () => { if (input.checked) onSelect(p); });
      const line = el('label', { for: `proj-${p.id}`, class: 'proj-item' },
        input,
        el('span', { class: 'proj-name' }, p.name),
        el('span', { class: 'proj-property' }, p.property),
      );
      container.appendChild(line);
    }
  }
  return container;
}

// A metadata block for the currently selected projection.
function metaBlock() {
  const name = el('div', { class: 'meta-name' });
  const aka  = el('div', { class: 'meta-aka' });
  const desc = el('div', { class: 'meta-desc' });
  const cite = el('div', { class: 'meta-cite' });
  const root = el('div', { class: 'meta' }, name, aka, desc, cite);
  return {
    root,
    update(p) {
      name.textContent = p.name;
      aka.textContent  = p.aka ? `also: ${p.aka}` : '';
      desc.textContent = p.description;
      cite.textContent = p.snyder;
    },
  };
}

// Build the full control panel and return handles to update it from the outside.
export function buildControls({ container, initial, onChange }) {
  // --- projection selector -----------------------------------------------
  const meta = metaBlock();
  const list = projectionList(initial.projectionId, (p) => selectProjection(p));

  // --- center/orientation controls ---------------------------------------
  const centerBlock = el('div', { class: 'block' }, el('h3', { class: 'block-title' }, 'center'));
  const phi0    = slider({ id: 'phi0',    label: 'Center latitude',   min: -90,  max: 90,  step: 0.5, initial: 0,  unit: 'deg',
                           onInput: (v) => onChange({ phi0: v * DEG }) });
  const lambda0 = slider({ id: 'lambda0', label: 'Central meridian',  min: -180, max: 180, step: 1,   initial: 0,  unit: 'deg',
                           onInput: (v) => onChange({ lambda0: v * DEG }) });
  centerBlock.appendChild(phi0.row);
  centerBlock.appendChild(lambda0.row);

  // --- projection-specific parameter block (rebuilt on projection change) --
  const paramBlock = el('div', { class: 'block' }, el('h3', { class: 'block-title' }, 'parameters'));
  const paramList  = el('div', { class: 'param-list' });
  paramBlock.appendChild(paramList);

  let paramSliders = {};
  function rebuildParams(projection) {
    paramList.innerHTML = '';
    paramSliders = {};
    if (projection.parameters.length === 0) {
      paramList.appendChild(el('div', { class: 'block-note' }, 'no free parameters'));
    }
    for (const spec of projection.parameters) {
      const s = slider({
        id: `param-${spec.key}`,
        label: spec.label,
        min: spec.min, max: spec.max, step: spec.step,
        initial: spec.default,
        unit: spec.unit || '',
        onInput: (v) => onChange({ [spec.key]: spec.unit === 'deg' ? v * DEG : v }),
      });
      paramSliders[spec.key] = s;
      paramList.appendChild(s.row);
    }
  }

  // --- noise + band controls (shader-side, always the same set) -----------
  const shaderBlock = el('div', { class: 'block' }, el('h3', { class: 'block-title' }, 'field'));
  const nfreq = slider({ id: 'nfreq', label: 'Noise frequency', min: 0.5, max: 8,   step: 0.05, initial: 2.5, onInput: (v) => onChange({ noiseFreq: v }) });
  const namp  = slider({ id: 'namp',  label: 'Noise amplitude', min: 0,   max: 1.0, step: 0.01, initial: 0.35, onInput: (v) => onChange({ noiseAmp: v }) });
  const blow  = slider({ id: 'blow',  label: 'Band start',      min: 0,   max: 1.0, step: 0.01, initial: 0.45, onInput: (v) => onChange({ bandLow: v }) });
  const bhigh = slider({ id: 'bhigh', label: 'Band end',        min: 0,   max: 1.0, step: 0.01, initial: 0.95, onInput: (v) => onChange({ bandHigh: v }) });
  shaderBlock.appendChild(nfreq.row);
  shaderBlock.appendChild(namp.row);
  shaderBlock.appendChild(blow.row);
  shaderBlock.appendChild(bhigh.row);

  // --- assemble -----------------------------------------------------------
  container.appendChild(el('div', { class: 'block block-projection' },
    el('h3', { class: 'block-title' }, 'projection'),
    list,
    meta.root,
  ));
  container.appendChild(centerBlock);
  container.appendChild(paramBlock);
  container.appendChild(shaderBlock);

  function selectProjection(p) {
    meta.update(p);
    rebuildParams(p);
    onChange({ projection: p });
  }

  // fire initial
  const first = projections.find(p => p.id === initial.projectionId) || projections[0];
  selectProjection(first);

  return {
    setPhi0(v)    { phi0.set(v * RAD); },
    setLambda0(v) { lambda0.set(v * RAD); },
    setParam(k, v, spec) { if (paramSliders[k]) paramSliders[k].set(spec.unit === 'deg' ? v * RAD : v); },
  };
}
