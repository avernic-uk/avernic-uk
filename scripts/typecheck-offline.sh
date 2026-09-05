#!/usr/bin/env bash
# =============================================================================
# Typecheck without node_modules.
#
# WHY THIS EXISTS
# The npm registry is unreachable from the environments this project is often
# edited in, so `npm install` fails and `npm run typecheck` can't run. The
# fallback used to be `tsc --noResolve`, which was worse than useless in a
# specific way: --noResolve stops TypeScript following imports, so every type
# imported from another file silently becomes `any` and NO cross-file type
# error is reported. A missing required property on a shared interface passed
# that check cleanly and then failed the Cloudflare build.
#
# This script instead runs the real project config, so `@/*` paths resolve and
# cross-file checking genuinely happens. Only the third-party packages are
# missing, so it filters exactly the errors that missing @types cause and shows
# everything else.
#
# It is a safety net, NOT a substitute for the real build. Anything it reports
# is real; things it can't see include prop-type mismatches against React
# components and anything depending on a library's types.
# =============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

# Errors that only occur because node_modules is absent:
#   TS2307 cannot find module          TS7016 no declaration file
#   TS7026 no JSX.IntrinsicElements    TS2875 no react/jsx-runtime
#   TS7006/TS7031 implicit any params  TS2882 side-effect css import
#   TS2339 import.meta.env             TS2322 `key` prop unknown without React types
#   TS7053 index signature via React-derived prop types
IGNORE='TS2307|TS7016|TS7026|TS2875|TS7006|TS7031|TS2882|TS7053'

OUT=$(npx --no-install tsc -p tsconfig.app.json --noEmit --ignoreDeprecations 6.0 2>&1 \
      || tsc -p tsconfig.app.json --noEmit --ignoreDeprecations 6.0 2>&1)

FILTERED=$(printf '%s\n' "$OUT" \
  | grep -E 'error TS' \
  | grep -vE "$IGNORE" \
  | grep -vE "Property 'env' does not exist on type 'ImportMeta'" \
  | grep -vE "Type '\{ key: .*\}' is not assignable")

if [ -n "$FILTERED" ]; then
  echo "Type errors found:"
  printf '%s\n' "$FILTERED"
  exit 1
fi
echo "No type errors (excluding the noise caused by missing node_modules)."
