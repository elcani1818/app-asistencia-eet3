$bytes = [System.IO.File]::ReadAllBytes("d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.pdf")
$text = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)
$pattern = "(?<=BT\s)(.*?)(?=\sET)"
$streamPattern = "(?<=stream\r?\n)([\s\S]*?)(?=\r?\nendstream)"
# Try to find readable text between PDF markers
$allText = ""
for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
    $b = $bytes[$i]
    if (($b -ge 32 -and $b -le 126) -or $b -eq 10 -or $b -eq 13 -or ($b -ge 192 -and $b -le 255)) {
        $allText += [char]$b
    } else {
        if ($allText.Length -gt 3) {
            # skip
        }
        $allText += " "
    }
}
# Extract words
$words = $allText -split '\s+' | Where-Object { $_.Length -ge 3 -and $_ -match '[a-zA-Z]' } | Select-Object -First 500
$words -join "`n"
