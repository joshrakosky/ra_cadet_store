# Decrypt a file the partner encrypted to your PUBLIC key (local-only workflow).
#
# Usage (PowerShell 5.1 or pwsh):
#   powershell -File scripts/decrypt-partner-file.ps1 -CipherFile ".\Downloads\partner-data.gpg"
#   powershell -File scripts/decrypt-partner-file.ps1 -CipherFile ".\Downloads\partner-data.gpg" -PlainOutPath ".\partner-pgp-local\decrypted\assignments.xlsx"

param(
    [Parameter(Mandatory = $true)]
    [string] $CipherFile,

    # If omitted, writes next to the cipher file using the basename (you can rename after decrypt).
    [Parameter(Mandatory = $false)]
    [string] $PlainOutPath
)

$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptRoot) {
    $ScriptRoot = $PSScriptRoot
}
. "$ScriptRoot\gpg-common.ps1"

if (-not (Test-Path -LiteralPath $CipherFile)) {
    Write-Error "Cipher file not found: $CipherFile"
}

$gpg = Get-GpgExecutable
if (-not $gpg) {
    Write-Error "gpg.exe not found. Install GnuPG or refresh PATH."
}

if (-not $PlainOutPath -or $PlainOutPath.Trim() -eq '') {
    $dir = Split-Path -LiteralPath $CipherFile
    $base = [IO.Path]::GetFileNameWithoutExtension($CipherFile)
    $PlainOutPath = Join-Path $dir $base
}

# No --batch here: Windows pinentry needs a TTY/GUI to collect the key passphrase.
$argsList = @('--decrypt', '--output', $PlainOutPath)
$outDir = Split-Path -Parent $PlainOutPath
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
$argsList += $CipherFile

# Prompts for passphrase if required (recommended for partner keys).
& $gpg @argsList
if ($LASTEXITCODE -ne 0) {
    Write-Error "gpg decrypt failed (exit $LASTEXITCODE)."
}
Write-Host "Decryption finished."
