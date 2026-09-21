# Подготовка репозитория на новой машине (Windows / PowerShell).
#   powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-portable.ps1 [-Codex] [-WithExternalSkills]
# Проверяет инструменты и показывает, чего не хватает. Навыки для Claude Code уже лежат в .claude\skills.
[CmdletBinding()]
param(
  [switch]$Codex,
  [switch]$WithExternalSkills,
  [switch]$SkipExternalSkills  # старый ключ: внешние навыки и так не ставятся без -WithExternalSkills
)

$ErrorActionPreference = 'Stop'
$repoRootPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).ProviderPath
$missing = @()
foreach ($tool in @('node', 'npx', 'ffmpeg', 'ffprobe', 'python')) {
  if (Get-Command $tool -ErrorAction SilentlyContinue) { Write-Host "ok   $tool" } else { Write-Host "нет  $tool"; $missing += $tool }
}
if (Get-Command node -ErrorAction SilentlyContinue) {
  $major = [int](& node -p 'process.versions.node.split(".")[0]')
  if ($major -lt 22) { Write-Host "нет  node >= 22"; $missing += 'node22' }
}

Write-Host "Claude Code: навыки уже в .claude\skills"

if ($Codex -or $WithExternalSkills) {
  $codexRootPath = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) { Join-Path $env:USERPROFILE '.codex' } else { $env:CODEX_HOME }
  $codexSkillsPath = Join-Path $codexRootPath 'skills'
  New-Item -ItemType Directory -Path $codexSkillsPath -Force | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $repoRootPath '.claude\skills') -Directory | ForEach-Object {
    $destination = Join-Path $codexSkillsPath $_.Name
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Get-ChildItem -LiteralPath $_.FullName -Force | Copy-Item -Destination $destination -Recurse -Force
    Write-Host "Codex: навык $($_.Name)"
  }
}

if ($WithExternalSkills) {
  $npxCommand = Get-Command npx -ErrorAction Stop
  & $npxCommand.Source --yes skills@1.5.23 add coreyhaines31/marketingskills@e55de886fe7580ec75cdb7ded5092b33f7d4ed58 `
    --global --agent codex --copy --yes `
    --skill product-marketing customer-research content-strategy copywriting copy-editing social marketing-psychology analytics
  & $npxCommand.Source --yes skills@1.5.23 add robpalmer99/claude-code-copywriting-skills@7dbfd61e0f283ca09c20b3eca3657365e00e991d `
    --global --agent codex --copy --yes `
    --skill direct-response-copy copychief ad-copy
}

if ($missing.Count -gt 0) {
  throw "Не хватает: $($missing -join ', '). Попроси Claude поставить их и запусти bootstrap ещё раз."
}
Write-Host "Студия: зависимости Remotion + Storybook"
Push-Location (Join-Path $PSScriptRoot "..\studio")
try {
  & (Get-Command npm).Source ci --no-audit --no-fund
  & (Get-Command npx).Source remotion browser ensure
} finally { Pop-Location }
Write-Host "Готово. Дальше: опрос владельца по docs/agent-contract/WORKFLOW.md (формат → стиль → вопросы по одному)."
Write-Host "Новый ролик: bash scripts/new-video.sh <id> <reels|youtube> <запись.mp4> (в WSL или Git Bash)."
