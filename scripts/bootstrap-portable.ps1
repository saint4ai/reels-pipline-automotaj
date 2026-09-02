<#
    bootstrap-portable.ps1
    onAI Academy — авторы пайплайна автомонтажа рилсов
    Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
    Источник: https://github.com/saint4ai/reels-pipline-automotaj
    Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
    origin=onai-rpa-2026-09  spec=three-laws/v1
#>
[CmdletBinding()]
param(
  [switch]$SkipExternalSkills
)

$ErrorActionPreference = 'Stop'

$repoRootPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).ProviderPath
$codexRootPath = if ([string]::IsNullOrWhiteSpace($env:CODEX_HOME)) {
  Join-Path $env:USERPROFILE '.codex'
} else {
  $env:CODEX_HOME
}
$codexSkillsPath = Join-Path $codexRootPath 'skills'

New-Item -ItemType Directory -Path $codexSkillsPath -Force | Out-Null

foreach ($skillName in @('onai-content-engine', 'talking-head-recut')) {
  $sourcePath = Join-Path $repoRootPath ".agents\skills\$skillName"
  $destinationPath = Join-Path $codexSkillsPath $skillName

  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Repo-local skill not found: $sourcePath"
  }

  New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
  Get-ChildItem -LiteralPath $sourcePath -Force |
    Copy-Item -Destination $destinationPath -Recurse -Force
  Write-Host "Installed local skill: $skillName"
}

if (-not $SkipExternalSkills) {
  $npxCommand = Get-Command npx -ErrorAction Stop

  & $npxCommand.Source --yes skills@1.5.23 add coreyhaines31/marketingskills@e55de886fe7580ec75cdb7ded5092b33f7d4ed58 `
    --global --agent codex --copy --yes `
    --skill product-marketing customer-research content-strategy copywriting copy-editing social marketing-psychology analytics
  if ($LASTEXITCODE -ne 0) { throw 'Marketing Skills installation failed.' }

  & $npxCommand.Source --yes skills@1.5.23 add robpalmer99/claude-code-copywriting-skills@7dbfd61e0f283ca09c20b3eca3657365e00e991d `
    --global --agent codex --copy --yes `
    --skill direct-response-copy copychief ad-copy
  if ($LASTEXITCODE -ne 0) { throw 'Rob Palmer skills installation failed.' }
}

Write-Host "Portable ONai setup complete. Codex skills: $codexSkillsPath"
