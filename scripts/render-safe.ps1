<#
    render-safe.ps1
    onAI Academy — авторы пайплайна автомонтажа рилсов
    Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
    Источник: https://github.com/saint4ai/reels-pipline-automotaj
    Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
    origin=onai-rpa-2026-09  spec=three-laws/v1
#>
<#
.SYNOPSIS
  Рендер с фильтрацией вывода для Windows. Fail fast, report later.

.DESCRIPTION
  Полный лог уходит в logs\render\, на экран попадает не больше двадцати строк.
  Без --quiet HyperFrames печатает около 108 КБ, из них 24 600 символов —
  закрашенные квадратики прогресс-бара. В одной сессии Codex такого мусора
  накопилось 596 160 символов: это и есть тот расход токенов, который
  описывали отчёты.

  Использует обычный установленный Chrome или Edge, чтобы Windows не открывал
  каскад консольных окон chrome-headless-shell.exe.

.EXAMPLE
  .\scripts\render-safe.ps1 -ProjectDirectory .\videos\reels-1-composio
#>
param(
  [Parameter(Mandatory = $true)][string]$ProjectDirectory,
  [string]$Output = "renders\out.mp4",
  [ValidateSet('draft', 'standard', 'high')][string]$Quality = 'high',
  [int]$Crf = 16
)

$ErrorActionPreference = 'Stop'

$project = (Resolve-Path -LiteralPath $ProjectDirectory).ProviderPath
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
$logDir = Join-Path $repoRoot 'logs\render'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $logDir ("{0}-{1}.log" -f (Split-Path $project -Leaf), $stamp)
$outPath = Join-Path $project $Output
New-Item -ItemType Directory -Force -Path (Split-Path $outPath -Parent) | Out-Null

# Обычный GUI-браузер вместо chrome-headless-shell: без всплывающих консолей.
$browser = @(
  if ($env:ProgramFiles) {
    Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
    Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'
  }
  if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe' }
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

$previous = $env:HYPERFRAMES_BROWSER_PATH
if ($browser) { $env:HYPERFRAMES_BROWSER_PATH = $browser }

try {
  & npx --yes 'hyperframes@0.8.20' render $project `
      --output $outPath --fps 30 --quality $Quality --crf $Crf `
      --workers 1 --no-browser-gpu --sdr --quiet *> $log
  $code = $LASTEXITCODE
}
finally {
  $env:HYPERFRAMES_BROWSER_PATH = $previous
}

# --- КЛАСС A: критическое. Дословно и сразу.
$critical = Select-String -Path $log -CaseSensitive:$false `
  -Pattern 'error|failed|exception|cannot find|ENOENT|invalid|timeout|crash' |
  Where-Object { $_.Line -notmatch '(?i)warn|deprecat' } | Select-Object -First 8

$logSize = (Get-Item $log).Length

if ($code -ne 0 -or $critical) {
  Write-Host "RENDER FAILED  exit=$code" -ForegroundColor Red
  foreach ($c in $critical) {
    $line = $c.Line.Trim()
    if ($line.Length -gt 200) { $line = $line.Substring(0, 200) }
    Write-Host "  [BLOCKING] $line" -ForegroundColor Red
  }
  Write-Host "  лог: $log ($logSize байт)"
  exit 1
}

# --- КЛАСС B: важное, не блокирующее. Только счётчик.
$warn = (Select-String -Path $log -CaseSensitive:$false `
  -Pattern 'warning|deprecated|fallback|missing optional').Count

# --- КЛАСС C: информационное. В контекст не попадает никогда.
$size = if (Test-Path $outPath) { '{0:N1} MB' -f ((Get-Item $outPath).Length / 1MB) } else { 'n/a' }
Write-Host "RENDER OK  $Output  $size  quality=$Quality  warnings=$warn" -ForegroundColor Green
Write-Host "  лог: $log ($logSize байт, агенту не нужен)"
