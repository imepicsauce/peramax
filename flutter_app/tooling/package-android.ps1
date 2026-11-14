[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$flutterRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$versionLine = Get-Content -LiteralPath (Join-Path $flutterRoot 'pubspec.yaml') |
    Where-Object { $_ -match '^version:\s*' } | Select-Object -First 1
if ($versionLine -notmatch '^version:\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?:\+\d+)?\s*$') {
    throw 'Cannot read the app version from pubspec.yaml.'
}
$appVersion = $Matches[1]

Push-Location -LiteralPath $flutterRoot
try {
    & flutter build apk --release --no-pub
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed; no installer was packaged.' }

    $sourceApk = Join-Path $flutterRoot 'build/app/outputs/flutter-apk/app-release.apk'
    if (!(Test-Path -LiteralPath $sourceApk -PathType Leaf)) { throw 'Release APK not found.' }
    $releaseTag = "v$appVersion-preview"
    $releaseDirectory = Join-Path $flutterRoot "releases/$releaseTag"
    New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null

    # The app currently uses development signing: distribute it as a preview.
    $installerName = "Peramax-$appVersion-preview-android.apk"
    $installerPath = Join-Path $releaseDirectory $installerName
    Copy-Item -LiteralPath $sourceApk -Destination $installerPath -Force
    Copy-Item -LiteralPath (Join-Path $flutterRoot 'INSTALL.md') -Destination $releaseDirectory -Force
    $sha256 = (Get-FileHash -LiteralPath $installerPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath (Join-Path $releaseDirectory 'SHA256SUMS.txt') -Encoding ASCII -Value "$sha256 *$installerName"

    Write-Output "Installer: $installerPath"
    Write-Output "GitHub release tag: $releaseTag (mark as pre-release)"
    Write-Output 'Upload the APK, SHA256SUMS.txt, and INSTALL.md as GitHub Release assets.'
} finally {
    Pop-Location
}
