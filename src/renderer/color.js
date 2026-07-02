// Latitude-driven color mapping with a noise perturbation on the transition
// band. Blue at the equator, white at the poles. Uniforms control the two
// endpoint colors so a client can swap palettes.

export const colorGlsl = `
uniform vec3 uEquatorColor;
uniform vec3 uPoleColor;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandLow;
uniform float uBandHigh;

// Blue-at-equator, white-at-poles shading. The transition band is perturbed
// by fBm on the sphere-surface point so the coastline is not a clean circle
// of latitude.
vec4 shadeSphere(float phi, float lambda) {
  float cp = cos(phi), sp = sin(phi);
  vec3 sph = vec3(cp * cos(lambda), cp * sin(lambda), sp);
  float n  = fbm(sph * uNoiseFreq);              // -1..1 ish
  float t  = abs(phi) / HALF_PI;                 // 0 equator, 1 pole
  float mixT = smoothstep(uBandLow, uBandHigh, t + n * uNoiseAmp);
  vec3 col   = mix(uEquatorColor, uPoleColor, mixT);
  return vec4(col, 1.0);
}
`;
