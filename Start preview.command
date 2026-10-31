#!/bin/zsh
cd "${0:A:h}"
candidate_node="$(command -v node 2>/dev/null)"
bundled_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ -n "$candidate_node" ]] && "$candidate_node" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' 2>/dev/null; then
  "$candidate_node" scripts/serve.mjs
elif [[ -x "$bundled_node" ]]; then
  "$bundled_node" scripts/serve.mjs
else
  echo "Install Node.js 22 or later from https://nodejs.org/, then open this file again."
  read "?Press Return to close."
fi
