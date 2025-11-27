#!/bin/bash
# Preliquify Development Script (Unix/macOS)
# This script starts the Preliquify development environment

set -e

echo "🚀 Starting Preliquify Development Environment"
echo ""

# Check if we're in a project with preliquify
if [ ! -f "preliquify.config.ts" ] && [ ! -f "preliquify.config.js" ]; then
    echo "⚠️  No preliquify.config.ts/js found."
    echo "   Run 'npx @preliquify/cli init' to set up your project."
    echo ""
fi

# Check for pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo "❌ Error: No package manager found (pnpm or npm required)"
    exit 1
fi

echo "📦 Using package manager: $PKG_MANAGER"
echo ""

# Build first
echo "🔨 Building packages..."
$PKG_MANAGER run build

# Start watch mode
echo ""
echo "👀 Starting watch mode..."
echo "   Press Ctrl+C to stop"
echo ""

$PKG_MANAGER run dev

