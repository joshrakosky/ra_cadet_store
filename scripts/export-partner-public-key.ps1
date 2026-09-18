# Export your PUBLIC key only - safe to send to the partner via secure channel.
#
# Usage (from repo root, PowerShell 5.1 or pwsh):
#   powershell -File scripts/export-partner-public-key.ps1 -KeyIdentifier "you@company.com"
#   powershell -File scripts/export-partner-public-key.ps1 -KeyIdentifier "ABCD1234..." -OutFile ".\partner-pgp-local\republic-new-hires-partner-public.asc"
#
# KeyIdentifier: email or long key id shown by: gpg --list-keys

param(
    [Parameter(Mandatory = $true)]
    [string] $KeyIdentifier,

    # Default: partner-pgp-local under repo root (git-ignored except README).
    [Parameter(Mandatory = $false)]
    [string] $OutFile
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot is not always set outside pwsh; MyCommand path works for -File invocations.
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptRoot) {
    $ScriptRoot = $PSScriptRoot
}
if (-not $OutFile -or $OutFile.Trim() -eq '') {
    $OutFile = Join-Path $ScriptRoot '..\partner-pgp-local\republic-new-hires-partner-public.asc'
}

. "$ScriptRoot\gpg-common.ps1"

$gpg = Get-GpgExecutable
if (-not $gpg) {
    Write-Error "gpg.exe not found. Install GnuPG (e.g. winget install GnuPG.GnuPG) and retry, or log out/in to refresh PATH."
}

$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# ASCII-armored public key only (never export private keys with this script).
$result = Invoke-GpgArmorPublicKeyExport -GpgPath $gpg -KeyIdentifier $KeyIdentifier
$keyText = $result.Text
if (-not $keyText -or $keyText -notmatch 'BEGIN PGP PUBLIC KEY BLOCK') {
    $hint = if ($result.StdErr) { " ($($result.StdErr))" } else { '' }
    Write-Error "No public key matched '$KeyIdentifier'.$hint Run gpg --list-keys and fix -KeyIdentifier (email or key id)."
}
$keyText | Set-Content -LiteralPath $OutFile -Encoding ascii
Write-Host "Wrote public key to: $OutFile"
Write-Host "Send this file to the partner over an agreed secure channel - not plaintext email unless required and approved."
