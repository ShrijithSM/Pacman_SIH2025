# PowerShell startup script for the backend server
Write-Host "🚀 Starting Campus Document Verification API..." -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = Join-Path $scriptDir "src"

Write-Host "📁 Navigating to: $srcDir" -ForegroundColor Yellow
Set-Location $srcDir

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "🐍 Starting Python server..." -ForegroundColor Cyan
python main.py

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Red
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
