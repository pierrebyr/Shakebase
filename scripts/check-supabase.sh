#!/usr/bin/env bash
# Pre-flight check for local development. Fails fast with a readable error
# instead of letting the app start and 500 on every request.
#
# Invoked by `pnpm dev:check` — plain `pnpm dev` skips this (useful when
# running against a remote Supabase project).

set -e

# 1. Required env file
if [ ! -f ".env.local" ]; then
  echo "✗ .env.local not found"
  echo "  Copy .env.example → .env.local and fill in the Supabase keys."
  exit 1
fi

# 2. Required env vars (just the Supabase ones — other services are optional)
source .env.local 2>/dev/null || true
missing=()
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SERVICE_ROLE_KEY; do
  eval "val=\${$var:-}"
  if [ -z "$val" ]; then missing+=("$var"); fi
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "✗ Missing env vars in .env.local:"
  for v in "${missing[@]}"; do echo "    - $v"; done
  exit 1
fi

# 3. Supabase reachable — accept any HTTP response (even 401). Connection
#    refused or timeout means the local stack isn't up.
url="$NEXT_PUBLIC_SUPABASE_URL"
if ! curl -fsS -o /dev/null -m 3 --stderr /dev/null "$url/auth/v1/health" 2>/dev/null; then
  # Fallback: just check TCP reachability (auth health is gated)
  if ! curl -s -o /dev/null -m 3 "$url" 2>/dev/null; then
    echo "✗ Can't reach $url"
    echo "  • Remote project? Check your network / project status"
    echo "  • Local stack?   Run: supabase start (requires Docker)"
    exit 1
  fi
fi

echo "✓ Supabase OK — starting dev server"
