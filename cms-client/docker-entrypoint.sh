#!/bin/sh
set -eu

# Escape a value for a double-quoted JavaScript string literal.
js_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

CMS_API_BASE_JS="$(js_escape "${CMS_API_BASE:-}")"
CMS_AI_DRAFTS_ENABLED_JS="$(js_escape "${CMS_AI_DRAFTS_ENABLED:-false}")"
CMS_AI_AGENT_ENABLED_JS="$(js_escape "${CMS_AI_AGENT_ENABLED:-false}")"

cat > /srv/config.js <<EOF
window.__ENV = {
  CMS_API_BASE: "${CMS_API_BASE_JS}",
  CMS_AI_DRAFTS_ENABLED: "${CMS_AI_DRAFTS_ENABLED_JS}",
  CMS_AI_AGENT_ENABLED: "${CMS_AI_AGENT_ENABLED_JS}"
};
EOF

exec "$@"
