param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectDirectory,

  [Parameter(Mandatory = $true)]
  [string]$Output,

  [ValidateSet('draft', 'standard', 'high')]
  [string]$Quality = 'high',

  [ValidateRange(1, 8)]
  [int]$Workers = 1
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
  throw 'Google Chrome or Microsoft Edge was not found. A regular GUI-subsystem browser is required to prevent visible chrome-headless-shell console windows.'
}

$resolvedProject = (Resolve-Path -LiteralPath $ProjectDirectory).ProviderPath
$previousBrowserPath = $env:HYPERFRAMES_BROWSER_PATH

try {
  # Regular Chrome/Edge runs headlessly without exposing one console window per
  # browser child process on Windows. Keep capture conservative and encode on GPU.
  $env:HYPERFRAMES_BROWSER_PATH = $browserPath
  $npxCommand = Get-Command npx -ErrorAction SilentlyContinue
  if (-not $npxCommand) {
    throw 'npx was not found in PATH. Install Node.js 22 or newer and reopen PowerShell.'
  }
  & $npxCommand.Source --yes 'hyperframes@0.8.20' render $resolvedProject --output $Output --quality $Quality --gpu --workers $Workers --no-browser-gpu --low-memory-mode --skill talking-head-recut --browser-timeout 120 --player-ready-timeout 120000
  if ($LASTEXITCODE -ne 0) {
    throw "Hyperframes render failed with exit code $LASTEXITCODE."
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
