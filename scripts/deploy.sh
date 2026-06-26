#!/usr/bin/env bash
# Build the web bundle and stage it into docs/ for GitHub Pages.
# Usage: npm run deploy
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Cleaning previous build…"
rm -rf dist docs

echo "→ Exporting web bundle…"
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npx expo export -p web

echo "→ Staging docs/ for GitHub Pages…"
cp -r dist docs
cp public/manifest.json public/sw.js docs/
cp -r public/icons docs/
cp _config.yml docs/          # force Jekyll to keep _expo/ if it runs
touch docs/.nojekyll
cp docs/index.html docs/404.html   # SPA fallback for client-side routes

echo "✓ Build ready in docs/. Commit and push to deploy."
