$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       PORTFOLIO UPDATE & DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Formatting source files..." -ForegroundColor Yellow

npx.cmd prettier --write "src/**/*.astro"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Astro formatting failed." -ForegroundColor Red
    exit 1
}

npx.cmd prettier --write "src/**/*.{css,ts}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: CSS/TypeScript formatting failed." -ForegroundColor Red
    exit 1
}

Write-Host "Formatting complete." -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Building Astro production site..." -ForegroundColor Yellow

npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Astro build failed. Nothing will be committed or pushed." -ForegroundColor Red
    exit 1
}

Write-Host "Production build successful." -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] Staging changes..." -ForegroundColor Yellow

git status --short
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git staging failed." -ForegroundColor Red
    exit 1
}

git diff --cached --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Changes ready to commit:" -ForegroundColor Cyan
git diff --cached --stat

Write-Host ""
$commitMessage = Read-Host "Commit message"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update portfolio"
}

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git commit failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Pushing to GitHub..." -ForegroundColor Yellow

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git push failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT PUSHED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

git status
