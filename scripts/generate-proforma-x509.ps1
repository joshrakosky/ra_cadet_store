# Generate Proforma's X509 certificate for Republic Airways portal onboarding.
# Republic's "Create x509 Public Key" form requires BEGIN CERTIFICATE — not OpenPGP.
#
# Usage (from repo root, PowerShell):
#   powershell -File scripts/generate-proforma-x509.ps1
#   powershell -File scripts/generate-proforma-x509.ps1 -Subject "/CN=Proforma/O=Proforma/C=US"
#
# Outputs (git-ignored under partner-pgp-local/):
#   proforma-public.pem  — send to Republic (public certificate only)
#   proforma-private.pem — NEVER share; store in vault / password manager

param(
    [Parameter(Mandatory = $false)]
    [string] $Subject = "/CN=Proforma/O=Proforma/C=US",

    [Parameter(Mandatory = $false)]
    [int] $DaysValid = 730,

    [Parameter(Mandatory = $false)]
    [string] $OutDir
)

$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptRoot) { $ScriptRoot = $PSScriptRoot }

if (-not $OutDir -or $OutDir.Trim() -eq '') {
    $OutDir = Join-Path $ScriptRoot '..\partner-pgp-local'
}

function Get-OpenSslExecutable {
    foreach ($dir in @(
            "$env:LocalAppData\Programs\Git\usr\bin",
            "$env:ProgramFiles\Git\usr\bin",
            "$env:ProgramFiles\OpenSSL-Win64\bin",
            "${env:ProgramFiles(x86)}\Git\usr\bin"
        )) {
        $candidate = Join-Path $dir 'openssl.exe'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    $fromPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($fromPath) { return $fromPath.Source }
    return $null
}

$openssl = Get-OpenSslExecutable
if (-not $openssl) {
    Write-Error "openssl.exe not found. Install Git for Windows or: winget install ShiningLight.OpenSSL.Light"
}

if (-not (Test-Path -LiteralPath $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$privatePath = Join-Path $OutDir 'proforma-private.pem'
$publicPath = Join-Path $OutDir 'proforma-public.pem'

if ((Test-Path $privatePath) -or (Test-Path $publicPath)) {
    Write-Warning "Existing cert files found. Remove them first if you intend to replace the key pair:"
    Write-Warning "  $privatePath"
    Write-Warning "  $publicPath"
    exit 1
}

Write-Host "Generating X509 certificate ($DaysValid days)..."
Write-Host "Subject: $Subject"

& $openssl req -x509 -newkey rsa:4096 `
    -keyout $privatePath `
    -out $publicPath `
    -days $DaysValid `
    -nodes `
    -subj $Subject

if ($LASTEXITCODE -ne 0) {
    Write-Error "openssl failed (exit $LASTEXITCODE)."
}

# Show validity dates for Republic's portal form (Valid From / Valid To).
$dates = & $openssl x509 -in $publicPath -noout -dates 2>&1
Write-Host ""
Write-Host "Created:"
Write-Host "  PUBLIC  (send to Republic): $publicPath"
Write-Host "  PRIVATE (never share):      $privatePath"
Write-Host ""
Write-Host "Certificate dates (for Republic portal):"
Write-Host $dates
Write-Host ""
Write-Host "Send ONLY proforma-public.pem to Republic. See docs/REPUBLIC_X509_ONBOARDING.md"
