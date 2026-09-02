param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectDirectory
)

$chromeCandidates = @(
  if ($env:ProgramFiles) {
    Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
    Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'
  }
  if ($env:LOCALAPPDATA) {
    Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'
  }
  if (${env:ProgramFiles(x86)}) {
    Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'
    Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
  }
)

$browserPath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browserPath) {
  throw 'Google Chrome or Microsoft Edge was not found.'
}

$resolvedProject = (Resolve-Path -LiteralPath $ProjectDirectory).ProviderPath
$npxCommand = Get-Command npx -ErrorAction SilentlyContinue
if (-not $npxCommand) {
  throw 'npx was not found in PATH. Install Node.js 22 or newer and reopen PowerShell.'
}

$previousBrowserPath = $env:HYPERFRAMES_BROWSER_PATH
try {
  $env:HYPERFRAMES_BROWSER_PATH = $browserPath
  & $npxCommand.Source --yes 'hyperframes@0.8.20' check $resolvedProject
  if ($LASTEXITCODE -ne 0) {
    throw "HyperFrames check failed with exit code $LASTEXITCODE."
  }
}
finally {
  if ($null -eq $previousBrowserPath) {
    Remove-Item Env:\HYPERFRAMES_BROWSER_PATH -ErrorAction SilentlyContinue
  }
  else {
    $env:HYPERFRAMES_BROWSER_PATH = $previousBrowserPath
  }
}
