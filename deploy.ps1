param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $SkipBuild) {
  Write-Host "Building production app..."
  npm run build

  if ($LASTEXITCODE -ne 0) {
    throw "Next.js build failed."
  }
}
else {
  Write-Host "Skipping build - using existing .next output..."
}

if (-not (Test-Path ".\.next\standalone")) {
  throw ".next\standalone not found. Run npm run build first."
}

Write-Host "Preparing public files..."
Copy-Item -Recurse -Force `
  .\public `
  .\.next\standalone\public

Write-Host "Preparing Next.js static files..."
New-Item -ItemType Directory -Force `
  .\.next\standalone\.next\static | Out-Null

Copy-Item -Recurse -Force `
  .\.next\static\* `
  .\.next\standalone\.next\static\

$zipPath = Join-Path $PSScriptRoot "hairdriver-app-production.zip"

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Write-Host "Creating deployment ZIP..."

Push-Location .\.next\standalone
try {
  tar -a -c -f $zipPath .
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Deployment package created successfully:"
Write-Host $zipPath