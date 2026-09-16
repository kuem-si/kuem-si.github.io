param([string]$Page)
$n = Get-Content "dist\$Page\index.html" -Raw
$b = Get-Content "dist-baseline\$Page\index.html" -Raw
Write-Output "--- BASELINE dashboard imgs:"
[regex]::Matches($b, '<img[^>]*dashboard[^>]*>') | ForEach-Object { $_.Value; "" }
Write-Output "--- NEW dashboard imgs:"
[regex]::Matches($n, '<img[^>]*dashboard[^>]*>') | ForEach-Object { $_.Value; "" }
