param(
  [string]$Base = "dist-baseline",
  [string]$New = "dist"
)

$basePath = (Resolve-Path $Base).Path
$newPath = (Resolve-Path $New).Path

$bPages = Get-ChildItem $basePath -Recurse -Filter *.html | ForEach-Object { $_.FullName.Substring($basePath.Length) }
$nPages = Get-ChildItem $newPath -Recurse -Filter *.html | ForEach-Object { $_.FullName.Substring($newPath.Length) }

Write-Output "baseline pages: $($bPages.Count), new pages: $($nPages.Count)"
$removed = Compare-Object $bPages $nPages | Where-Object { $_.SideIndicator -eq '<=' } | ForEach-Object { $_.InputObject }
$added = Compare-Object $bPages $nPages | Where-Object { $_.SideIndicator -eq '=>' } | ForEach-Object { $_.InputObject }
Write-Output "removed: $($removed.Count)"
$removed | ForEach-Object { Write-Output "  $_" }
Write-Output "added: $($added.Count)"
$added | ForEach-Object { Write-Output "  $_" }

function Get-Body([string]$path) {
  $raw = Get-Content $path -Raw
  $m = [regex]::Match($raw, "(?s)<body.*?</body>")
  if ($m.Success) { return $m.Value }
  return $raw
}

Write-Output ""
Write-Output "=== body diff per shared page ==="
foreach ($page in $nPages) {
  if ($removed -contains $page) { continue }
  $bFile = Join-Path $basePath $page.TrimStart('\')
  if (-not (Test-Path $bFile)) { continue }
  $bBody = Get-Body $bFile
  $nBody = Get-Body (Join-Path $newPath $page.TrimStart('\'))
  if ($bBody -ne $nBody) {
    $bLines = $bBody -split '(?=<[a-zA-Z/!])' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    $nLines = $nBody -split '(?=<[a-zA-Z/!])' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    $diff = Compare-Object $bLines $nLines | Where-Object { $_.SideIndicator -ne '==' }
    Write-Output ("DIFF {0} ({1} segments differ)" -f $page, $diff.Count)
    $diff | Select-Object -First 6 | ForEach-Object { Write-Output ("    {0} {1}" -f $_.SideIndicator, $_.InputObject.Substring(0, [Math]::Min(130, $_.InputObject.Length))) }
  }
}

Write-Output ""
Write-Output "=== CSS diff ==="
$bCss = Get-ChildItem $basePath -Recurse -Filter *.css
foreach ($css in $bCss) {
  $rel = $css.FullName.Substring($basePath.Length)
  $nFile = Join-Path $newPath $rel
  if (-not (Test-Path $nFile)) { Write-Output "CSS REMOVED: $rel"; continue }
  $b = Get-Content $css.FullName -Raw
  $n = Get-Content $nFile -Raw
  if ($b -ne $n) { Write-Output "CSS DIFF: $rel" }
}
Write-Output "=== CSS files added ==="
Get-ChildItem $newPath -Recurse -Filter *.css | ForEach-Object { $rel = $_.FullName.Substring($newPath.Length); if (-not (Test-Path (Join-Path $basePath $rel))) { Write-Output "  $rel" } }
