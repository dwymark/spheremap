#!/usr/bin/env bash
# Bundle the ES-module source into a single self-contained HTML file.
#
# The strategy is embarrassingly simple: concatenate the JS in dependency
# order, strip import/export syntax, wrap in an IIFE, inline the CSS.
# No external dependencies -- bash, sed, cat.
#
# Usage: ./build.sh            # writes dist/index.html
#        ./build.sh /some/path  # writes to that path instead

set -euo pipefail
cd "$(dirname "$0")"

out="${1:-dist/index.html}"
mkdir -p "$(dirname "$out")"

FILES=(
  src/projections/base.js
  src/projections/equirectangular.js
  src/projections/mercator.js
  src/projections/cylindrical-equal-area.js
  src/projections/sinusoidal.js
  src/projections/mollweide.js
  src/projections/orthographic.js
  src/projections/stereographic.js
  src/projections/gnomonic.js
  src/projections/azimuthal-equidistant.js
  src/projections/lambert-azimuthal-equal-area.js
  src/projections/index.js
  src/renderer/noise.js
  src/renderer/color.js
  src/renderer/shaders.js
  src/renderer/webgl.js
  src/ui/controls.js
  demo/main.js
)

# strip_module: remove ES module syntax from a file so the concatenated
# result can live inside a single IIFE.
#   - drop any line starting with `import ` (possibly multi-line, but we
#     wrote them all as single-line imports so this is enough)
#   - rewrite `export const/function/class/let/var` -> `const/function/...`
strip_module() {
  # Every import in this codebase is a single-line statement; drop those
  # lines outright and remove the `export` prefix from top-level bindings.
  sed -E \
    -e '/^import[[:space:]]/d' \
    -e '/^export[[:space:]]+\{/d' \
    -e 's/^export[[:space:]]+(const|function|class|let|var)[[:space:]]/\1 /' \
    "$1"
}

TMP_JS="$(mktemp)"
trap 'rm -f "$TMP_JS"' EXIT
{
  echo "(function() {"
  echo "'use strict';"
  for f in "${FILES[@]}"; do
    echo ""
    echo "// ==== $f ===="
    strip_module "$f"
  done
  echo "})();"
} > "$TMP_JS"

CSS_FILE="demo/style.css"
CSS="$(cat "$CSS_FILE")"
JS="$(cat "$TMP_JS")"

# Read the demo HTML and inline the CSS + JS. We swap the <link rel=stylesheet>
# for a <style>, and the <script type=module> for a plain <script>.
python3 - "$out" <<PYEOF
import sys, pathlib
out = sys.argv[1]
html = pathlib.Path('demo/index.html').read_text()
css  = pathlib.Path('demo/style.css').read_text()
js   = pathlib.Path('$TMP_JS').read_text()
html = html.replace(
  '<link rel="stylesheet" href="./style.css">',
  '<style>\n' + css + '\n</style>',
)
html = html.replace(
  '<script type="module" src="./main.js"></script>',
  '<script>\n' + js + '\n</script>',
)
pathlib.Path(out).write_text(html)
print(f'wrote {out} ({len(html)} bytes)')
PYEOF
