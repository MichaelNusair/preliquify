# Preliquify Development Script (Windows PowerShell)
# This script starts the Preliquify development environment

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Preliquify Development Environment" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a project with preliquify
if (-not (Test-Path "preliquify.config.ts") -and -not (Test-Path "preliquify.config.js")) {
    Write-Host "⚠️  No preliquify.config.ts/js found." -ForegroundColor Yellow
    Write-Host "   Run 'npx @preliquify/cli init' to set up your project."
    Write-Host ""
}

# Check for package manager
$PKG_MANAGER = $null
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $PKG_MANAGER = "pnpm"
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    $PKG_MANAGER = "npm"
} else {
    Write-Host "❌ Error: No package manager found (pnpm or npm required)" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Using package manager: $PKG_MANAGER" -ForegroundColor Green
Write-Host ""

# Build first
Write-Host "🔨 Building packages..." -ForegroundColor Cyan
& $PKG_MANAGER run build

# Start watch mode
Write-Host ""
Write-Host "👀 Starting watch mode..." -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop"
Write-Host ""

& $PKG_MANAGER run dev

