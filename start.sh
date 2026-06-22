#!/bin/bash
# Simple script to build and run the game

echo "🔧 Building the project..."
make build

echo "✅ Build complete. Starting a local server to test..."

# Try to use python3 http server if available
if command -v python3 >/dev/null 2>&1; then
    cd AL67X-Simulator-main
    python3 -m http.server 8000
elif command -v npx >/dev/null 2>&1; then
    cd AL67X-Simulator-main
    npx serve . --listen 8000
else
    echo "⚠️  No server command found. Please serve the directory manually."
    echo "   Example: python3 -m http.server 8000"
fi
