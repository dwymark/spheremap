// WebGL renderer for the projection library. Prefers WebGL2, but falls
// back to WebGL1 by rewriting the GLSL 3.00 ES source to GLSL 1.00 ES
// (in/out -> attribute/varying, gl_FragColor for the output, no #version).
//
// Owns the GL context, the fullscreen quad, and the current shader program.
// A projection's GLSL is baked into the fragment shader at compile time;
// switching projections triggers a recompile.

import { vertexSrc, buildFragment } from './shaders.js';
import { noiseGlsl }                from './noise.js';
import { colorGlsl }                from './color.js';
import { packUniform }              from '../projections/base.js';

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed:\n${log}\n\n---\n${src}`);
  }
  return sh;
}

function link(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`program link failed:\n${log}`);
  }
  return prog;
}

// Downgrade a GLSL 3.00 ES source to GLSL 1.00 ES so it will compile on a
// WebGL1 context. Deliberately mechanical: rewrites the storage keywords
// and the fragment output; no other 3.00-only features are used in this
// project's shaders.
function toGLSL100(src, stage /* 'vertex' | 'fragment' */) {
  let out = src.replace(/^\s*#version\s+300\s+es\s*\n/, '');
  if (stage === 'vertex') {
    out = out.replace(/^\s*in\s+/gm,  'attribute ');
    out = out.replace(/^\s*out\s+/gm, 'varying ');
  } else {
    out = out.replace(/^\s*in\s+/gm, 'varying ');
    out = out.replace(/^\s*out\s+vec4\s+outColor\s*;\s*\n/gm, '');
    out = out.replace(/\boutColor\b/g, 'gl_FragColor');
  }
  return out;
}

// Fit the projection's natural bounds inside the canvas without distortion.
// Returns display-space bounds vec4(xmin, ymin, xmax, ymax).
export function fitBounds(natural, canvasW, canvasH) {
  const W = natural.xmax - natural.xmin;
  const H = natural.ymax - natural.ymin;
  const projAspect = W / H;
  const canvasAspect = canvasW / canvasH;
  let xmin = natural.xmin, xmax = natural.xmax;
  let ymin = natural.ymin, ymax = natural.ymax;
  if (projAspect > canvasAspect) {
    const newH = W / canvasAspect;
    const cy = 0.5 * (ymin + ymax);
    ymin = cy - newH / 2;
    ymax = cy + newH / 2;
  } else {
    const newW = H * canvasAspect;
    const cx = 0.5 * (xmin + xmax);
    xmin = cx - newW / 2;
    xmax = cx + newW / 2;
  }
  return { xmin, xmax, ymin, ymax };
}

export class WebGLRenderer {
  constructor(canvas) {
    let gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false });
    let isGL2 = !!gl;
    if (!gl) {
      gl = canvas.getContext('webgl',              { antialias: true, premultipliedAlpha: false })
        || canvas.getContext('experimental-webgl', { antialias: true, premultipliedAlpha: false });
    }
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    this.isGL2 = isGL2;
    this.canvas = canvas;

    // Fullscreen quad in NDC.
    const quad = new Float32Array([-1,-1,  1,-1,  -1, 1,  -1, 1,  1,-1,  1, 1]);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const vSrc = isGL2 ? vertexSrc : toGLSL100(vertexSrc, 'vertex');
    this.vs = compile(gl, gl.VERTEX_SHADER, vSrc);
    this.program = null;
    this.projection = null;
    this.params = null;

    this.noise  = { freq: 2.5, amp: 0.35 };
    this.band   = { low: 0.45, high: 0.95 };
    this.colors = {
      equator: [0.16, 0.42, 0.66],
      pole:    [0.97, 0.97, 0.97],
      bg:      [0.965, 0.955, 0.93],
    };
  }

  setProjection(projection) {
    if (this.projection && this.projection.id === projection.id) return;
    this.projection = projection;
    const gl = this.gl;
    let fragSrc = buildFragment({
      noise:      noiseGlsl,
      color:      colorGlsl,
      projection: projection.glslInverse,
    });
    if (!this.isGL2) fragSrc = toGLSL100(fragSrc, 'fragment');
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (this.program) gl.deleteProgram(this.program);
    this.program = link(gl, this.vs, fs);
    gl.deleteShader(fs);

    this.loc = {
      aPos:         gl.getAttribLocation(this.program, 'aPos'),
      uBounds:      gl.getUniformLocation(this.program, 'uBounds'),
      uProj:        gl.getUniformLocation(this.program, 'uProj'),
      uBgColor:     gl.getUniformLocation(this.program, 'uBgColor'),
      uEquator:     gl.getUniformLocation(this.program, 'uEquatorColor'),
      uPole:        gl.getUniformLocation(this.program, 'uPoleColor'),
      uNoiseFreq:   gl.getUniformLocation(this.program, 'uNoiseFreq'),
      uNoiseAmp:    gl.getUniformLocation(this.program, 'uNoiseAmp'),
      uBandLow:     gl.getUniformLocation(this.program, 'uBandLow'),
      uBandHigh:    gl.getUniformLocation(this.program, 'uBandHigh'),
    };
  }

  setParams(params) { this.params = params; }
  setNoise(freq, amp) { this.noise.freq = freq; this.noise.amp = amp; }
  setBand(low, high)  { this.band.low = low; this.band.high = high; }
  setColors({ equator, pole, bg }) {
    if (equator) this.colors.equator = equator;
    if (pole)    this.colors.pole    = pole;
    if (bg)      this.colors.bg      = bg;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  render() {
    if (!this.program || !this.projection || !this.params) return;
    const gl = this.gl;

    const natural = this.projection.bounds(this.params);
    const b = fitBounds(natural, this.canvas.width, this.canvas.height);

    gl.clearColor(this.colors.bg[0], this.colors.bg[1], this.colors.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform4f(this.loc.uBounds, b.xmin, b.ymin, b.xmax, b.ymax);
    gl.uniform4fv(this.loc.uProj, packUniform(this.params));
    gl.uniform3fv(this.loc.uBgColor, this.colors.bg);
    gl.uniform3fv(this.loc.uEquator, this.colors.equator);
    gl.uniform3fv(this.loc.uPole,    this.colors.pole);
    gl.uniform1f(this.loc.uNoiseFreq, this.noise.freq);
    gl.uniform1f(this.loc.uNoiseAmp,  this.noise.amp);
    gl.uniform1f(this.loc.uBandLow,   this.band.low);
    gl.uniform1f(this.loc.uBandHigh,  this.band.high);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(this.loc.aPos);
    gl.vertexAttribPointer(this.loc.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
