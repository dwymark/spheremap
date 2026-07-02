// Projection registry. Import here to add a new projection.

import { equirectangular }             from './equirectangular.js';
import { mercator }                    from './mercator.js';
import { cylindricalEqualArea }        from './cylindrical-equal-area.js';
import { sinusoidal }                  from './sinusoidal.js';
import { mollweide }                   from './mollweide.js';
import { orthographic }                from './orthographic.js';
import { stereographic }               from './stereographic.js';
import { gnomonic }                    from './gnomonic.js';
import { azimuthalEquidistant }        from './azimuthal-equidistant.js';
import { lambertAzimuthalEqualArea }   from './lambert-azimuthal-equal-area.js';

export const projections = [
  equirectangular,
  mercator,
  cylindricalEqualArea,
  sinusoidal,
  mollweide,
  orthographic,
  stereographic,
  gnomonic,
  azimuthalEquidistant,
  lambertAzimuthalEqualArea,
];

export const projectionsById = Object.fromEntries(projections.map(p => [p.id, p]));

export function getProjection(id) {
  const proj = projectionsById[id];
  if (!proj) throw new Error(`unknown projection: ${id}`);
  return proj;
}
