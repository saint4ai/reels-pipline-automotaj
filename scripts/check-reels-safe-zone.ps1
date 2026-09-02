param(
  [Parameter(Mandatory = $true)]
  [string]$InputVideo,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory,

  [switch]$Open
)

$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobeCommand = Get-Command ffprobe -ErrorAction SilentlyContinue
if (-not $ffmpegCommand -or -not $ffprobeCommand) {
  throw 'ffmpeg and ffprobe are required and must be available in PATH.'
}

$resolvedInput = (Resolve-Path -LiteralPath $InputVideo).ProviderPath
$overlayPath = Join-Path $PSScriptRoot '..\reference\platform-guides\instagram-reels\safe-zone-1080x1920.png'
$resolvedOverlay = (Resolve-Path -LiteralPath $overlayPath).ProviderPath

$probeArguments = @(
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height,sample_aspect_ratio:stream_tags=rotate:stream_side_data=rotation:format=duration',
  '-of', 'json',
  $resolvedInput
)
$probeJson = & $ffprobeCommand.Source @probeArguments
if ($LASTEXITCODE -ne 0 -or -not $probeJson) {
  throw 'ffprobe could not read the input video.'
}

$probe = $probeJson | ConvertFrom-Json
$stream = @($probe.streams)[0]
if (-not $stream) {
  throw 'No video stream was found.'
}

$width = [int]$stream.width
$height = [int]$stream.height
$sampleAspectRatio = [string]$stream.sample_aspect_ratio
$duration = [double]::Parse([string]$probe.format.duration, [Globalization.CultureInfo]::InvariantCulture)

$rotations = @()
if ($stream.tags -and $null -ne $stream.tags.rotate) {
  $rotations += [double]$stream.tags.rotate
}
foreach ($sideData in @($stream.side_data_list)) {
  if ($null -ne $sideData.rotation) {
    $rotations += [double]$sideData.rotation
  }
}
$rotation = if ($rotations.Count -gt 0) { [double]$rotations[0] } else { 0 }

$technicalErrors = @()
if ($width -ne 1080 -or $height -ne 1920) {
  $technicalErrors += "Expected 1080x1920, found ${width}x${height}."
}
if ($sampleAspectRatio -and $sampleAspectRatio -notin @('1:1', 'N/A', '0:1')) {
  $technicalErrors += "Expected square pixels (SAR 1:1), found $sampleAspectRatio."
}
if ([math]::Abs($rotation) -gt 0.01) {
  $technicalErrors += "Expected rotation 0, found $rotation degrees."
}
if (-not [double]::IsFinite($duration) -or $duration -le 0) {
  $technicalErrors += "Expected a positive duration, found $duration."
}
if ($technicalErrors.Count -gt 0) {
  throw ($technicalErrors -join [Environment]::NewLine)
}

$resolvedOutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutputDirectory | Out-Null

$stem = [IO.Path]::GetFileNameWithoutExtension($resolvedInput)
$qaVideo = Join-Path $resolvedOutputDirectory "$stem-reels-safe-zone-qa.mp4"
$filter = '[0:v][1:v]overlay=0:0:format=auto:shortest=1[v]'

$renderArguments = @(
  '-hide_banner', '-loglevel', 'error', '-y',
  '-i', $resolvedInput,
  '-loop', '1', '-i', $resolvedOverlay,
  '-filter_complex', $filter,
  '-map', '[v]', '-map', '0:a?',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart', '-shortest',
  $qaVideo
)
& $ffmpegCommand.Source @renderArguments
if ($LASTEXITCODE -ne 0) {
  throw "Could not render the safe-zone QA video. ffmpeg exited with code $LASTEXITCODE."
}

$fractions = @(0.05, 0.25, 0.50, 0.75, 0.95)
for ($index = 0; $index -lt $fractions.Count; $index++) {
  $timestamp = [math]::Min([math]::Max(0.0, $duration * $fractions[$index]), [math]::Max(0.0, $duration - 0.05))
  $timestampText = $timestamp.ToString('0.000', [Globalization.CultureInfo]::InvariantCulture)
  $frameName = '{0}-reels-safe-zone-frame-{1:D2}.png' -f $stem, ($index + 1)
  $framePath = Join-Path $resolvedOutputDirectory $frameName
  & $ffmpegCommand.Source -hide_banner -loglevel error -y -ss $timestampText -i $qaVideo -frames:v 1 -update 1 $framePath
  if ($LASTEXITCODE -ne 0) {
    throw "Could not extract QA frame at $timestampText seconds."
  }
}

Write-Host "Safe-zone QA video: $qaVideo"
Write-Host "Five guided frames: $resolvedOutputDirectory"
Write-Host 'Visual review is still required: the overlay cannot distinguish decoration from critical content.'

if ($Open) {
  Invoke-Item -LiteralPath $qaVideo
}
