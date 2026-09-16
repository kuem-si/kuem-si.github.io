$ok = $true
function Check([string]$label, [bool]$cond) {
  $script:ok = $script:ok -and $cond
  Write-Output ("{0} {1}" -f ($(if ($cond) { "PASS" } else { "FAIL" })), $label)
}

# 1. llms.txt
Check "llms.txt exists" (Test-Path dist\llms.txt)
$llms = Get-Content dist\llms.txt -Raw
Check "llms.txt has KUEM header" ($llms -match "# KUEM")
Check "llms.txt lists EN solutions" ($llms -match "Remote meter reading")
Check "llms.txt lists SL solutions" ($llms -match "Daljinsko odčitavanje")

# 2. sitemap
$sm = Get-Content dist\sitemap-0.xml -Raw
Check "sitemap has hreflang alternates" ($sm -match 'xhtml:link rel="alternate"')
Check "no legacy pages in dist" (-not (Test-Path dist\about) -and -not (Test-Path dist\sl) -and -not (Test-Path dist\o-podjetju))
Check "sitemap keeps /en/company" ($sm -match '<loc>https://www\.kuem\.si/en/company/</loc>')
Check "sitemap keeps /o-nas" ($sm -match '<loc>https://www\.kuem\.si/o-nas/</loc>')

# 3. no import.meta leftovers
$hits = Get-ChildItem dist -Recurse -Include *.html | Select-String -Pattern 'import\.meta' -List
Check "no import.meta literals in dist" ($null -eq $hits)

# 4. legacy routes must 404 (no redirect stubs are emitted anymore)
Check "legacy /about route is gone" (-not (Test-Path dist\about))
Check "legacy /sl route is gone" (-not (Test-Path dist\sl))
Check "legacy /o-podjetju route is gone" (-not (Test-Path dist\o-podjetju))

# 5. homepage head
$h = Get-Content dist\index.html -Raw
$head = [regex]::Match($h, '(?s)<head>.*?</head>').Value
Check "viewport has initial-scale" ($head -match 'width=device-width, initial-scale=1')
Check "theme-color present" ($head -match 'name="theme-color" content="#161a1d"')
Check "og:site_name present" ($head -match 'property="og:site_name" content="KUEM"')
Check "og:image:width present" ($head -match 'property="og:image:width" content="1200"')
Check "twitter:image present" ($head -match 'name="twitter:image"')
Check "font preloads present" (([regex]::Matches($head, 'rel="preload"')).Count -ge 2)
Check "Organization JSON-LD present" ($head -match '"@type":"Organization"')
Check "WebSite JSON-LD present" ($head -match '"@type":"WebSite"')
Check "SoftwareApplication JSON-LD present" ($head -match '"@type":"SoftwareApplication"')

# 6. solution page JSON-LD
$s = Get-Content dist\en\solutions\remote-meter-reading\index.html -Raw
Check "Service JSON-LD on solution page" ($s -match '"@type":"Service"')
Check "BreadcrumbList on solution page" ($s -match '"@type":"BreadcrumbList"')

# 7. avif output
$avifs = Get-ChildItem dist\_astro -Filter *.avif
Check "avif images generated" ($avifs.Count -ge 2)
$avifs | ForEach-Object { Write-Output "      avif: $($_.Name) $([math]::Round($_.Length/1KB,1))KB" }

# 8. sizes
$tot = (Get-ChildItem dist -Recurse -File | Measure-Object -Property Length -Sum).Sum
$bTot = (Get-ChildItem dist-baseline -Recurse -File | Measure-Object -Property Length -Sum).Sum
Check ("dist smaller than baseline ({0:N2} MB vs {1:N2} MB)" -f ($tot/1MB), ($bTot/1MB)) ($tot -lt $bTot)

# 9. no stale references to legacy paths in kept pages
$bad = Get-ChildItem dist -Recurse -Filter *.html | Select-String -Pattern 'href="/sl/|href="/o-podjetju|href="/about"|href="/case-studies' -List
Check "no internal links to removed URLs" ($null -eq $bad)

Write-Output ""
if ($ok) { Write-Output "ALL CHECKS PASSED" } else { Write-Output "SOME CHECKS FAILED" }
