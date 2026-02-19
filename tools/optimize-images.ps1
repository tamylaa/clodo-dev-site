# Simple ImageMagick-based optimizer (robust, ASCII-only)
param(
  [string]$SourceDir = 'public/images/originals',
  [string]$OutRoot = 'public/images/optimized',
  [string]$WidthList = '2400,1600,1200,800,480,400,200',
  [int]$WebpQuality = 80,
  [int]$PngQuality = 90
)

function Ensure-Dir($p){ if(-not (Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }

if(-not (Test-Path $SourceDir)){
  Write-Host "Source directory '$SourceDir' not found - falling back to 'public/images'"
  $SourceDir = 'public/images'
}

$Widths = $WidthList -split ',' | ForEach-Object { [int]$_ }
$excludeDirs = @('optimized')

Get-ChildItem -Path $SourceDir -Recurse -File -Include *.png,*.jpg,*.jpeg | Where-Object {
  foreach($ex in $excludeDirs){ if ($_.FullName -like "*\$ex\*") { return $false } }
  return $true
} | ForEach-Object {
  $src = $_.FullName
  $base = $_.BaseName
  $outdir = Join-Path $OutRoot $base
  Ensure-Dir $outdir

  foreach($w in $Widths){
    $outWebp = Join-Path $outdir ("$base-$w.webp")
    if((Test-Path $outWebp) -and ((Get-Item $outWebp).LastWriteTime -gt (Get-Item $src).LastWriteTime)){
      Write-Host "skip: $outWebp (up-to-date)"
      continue
    }
    Write-Host "gen: $outWebp"
    magick "$src" -strip -quality $WebpQuality -resize ${w}x "$outWebp"
  }

  $pngOut = Join-Path $outdir ("$base-1200.png")
  if(-not ((Test-Path $pngOut) -and ((Get-Item $pngOut).LastWriteTime -gt (Get-Item $src).LastWriteTime))){
    Write-Host "gen: $pngOut"
    magick "$src" -strip -quality $PngQuality -resize 1200x "$pngOut"
  } else { Write-Host "skip: $pngOut (up-to-date)" }
}

Write-Host 'Optimization complete.'
