// Vertex shader (fixed) and fragment shader template. The fragment template
// contains three splice points ({{NOISE}}, {{PROJECTION}}, {{COLOR}}) that
// the renderer fills at compile time.

export const vertexSrc = `#version 300 es
in vec2 aPos;
out vec2 vNdc;
void main() {
  vNdc = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const fragmentTemplate = `#version 300 es
precision highp float;

const float PI_     = 3.14159265358979323846;
const float HALF_PI = 1.5707963267948966;
const float TWO_PI  = 6.283185307179586;

in vec2 vNdc;
uniform vec4 uBounds;      // xmin, ymin, xmax, ymax (display-fitted)
uniform vec4 uProj;        // phi0, lambda0, phi1, phi2
uniform vec3 uBgColor;

out vec4 outColor;

// {{NOISE}}
// {{COLOR}}
// {{PROJECTION}}

void main() {
  vec2 t   = 0.5 * (vNdc + 1.0);
  vec2 xy  = mix(uBounds.xy, uBounds.zw, t);
  vec3 res = inverseProject(xy, uProj);
  if (res.z < 0.5) {
    outColor = vec4(uBgColor, 1.0);
    return;
  }
  outColor = shadeSphere(res.x, res.y);
}
`;

// Splice the three source fragments into the template.
export function buildFragment({ noise, color, projection }) {
  return fragmentTemplate
    .replace('// {{NOISE}}',      noise)
    .replace('// {{COLOR}}',      color)
    .replace('// {{PROJECTION}}', projection);
}
