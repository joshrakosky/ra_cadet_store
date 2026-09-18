# Shared helpers for partner PGP scripts (OpenPGP / GnuPG on Windows).

function Get-GpgExecutable {
    # Prefer standard install locations when gpg is not yet on PATH (fresh winget/Gpg4win install).
    foreach ($dir in @(
            "${env:ProgramFiles(x86)}\GnuPG\bin",
            "$env:ProgramFiles\GnuPG\bin",
            "$env:LocalAppData\Programs\GnuPG\bin"
        )) {
        $candidate = Join-Path $dir 'gpg.exe'
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }
    $fromPath = Get-Command gpg -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }
    return $null
}

function Invoke-GpgArmorPublicKeyExport {
    param(
        [Parameter(Mandatory = $true)]
        [string] $GpgPath,
        [Parameter(Mandatory = $true)]
        [string] $KeyIdentifier
    )
    # Native gpg writes benign stderr (e.g. "nothing exported"); avoid PowerShell stderr-as-non-terminating-errors.
    $kid = $KeyIdentifier.Trim()
    if ($kid.IndexOf(' ') -ge 0) {
        $kid = '"' + ($kid.Replace('"', '\"')) + '"'
    }
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $GpgPath
    $pinfo.Arguments = "--armor --export $kid"
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    [void]$p.Start()
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd().Trim()
    $p.WaitForExit()
    return [pscustomobject]@{
        Text   = $stdout.TrimEnd()
        StdErr = $stderr
        Exit   = $p.ExitCode
    }
}
