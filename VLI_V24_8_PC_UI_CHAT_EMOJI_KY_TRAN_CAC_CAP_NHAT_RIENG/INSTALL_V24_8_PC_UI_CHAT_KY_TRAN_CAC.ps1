param([string]$GameDir='', [switch]$Restore)
$ErrorActionPreference = 'Stop'
$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$folderName = 'vli-pc-ui-v248'
$source = Join-Path $patchRoot ('PATCH_DATA\' + $folderName)
$backupName = '_BACKUP_PC_UI_V24_8'

function IsGame([string]$folder) {
  if ([string]::IsNullOrWhiteSpace($folder)) { return $false }
  return (Test-Path -LiteralPath (Join-Path $folder 'index.html') -PathType Leaf) -and
    (Test-Path -LiteralPath (Join-Path $folder 'js\main.js') -PathType Leaf) -and
    (Test-Path -LiteralPath (Join-Path $folder 'js\render.js') -PathType Leaf)
}
if (-not $GameDir) {
  $parent = Split-Path -Parent $patchRoot
  $grandparent = Split-Path -Parent $parent
  $candidates = @($patchRoot, $parent, $grandparent)
  if (Test-Path -LiteralPath $parent) {
    $candidates += @(Get-ChildItem -LiteralPath $parent -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }
  if (Test-Path -LiteralPath $grandparent) {
    $candidates += @(Get-ChildItem -LiteralPath $grandparent -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }
  $found = @($candidates | Select-Object -Unique | Where-Object { IsGame $_ })
  if ($found.Count -eq 1) {
    $GameDir = $found[0]
    Write-Host ('Tim thay thu muc game: ' + $GameDir) -ForegroundColor Cyan
  } else {
    $GameDir = (Read-Host 'Nhap DUONG DAN THU MUC GAME chua index.html').Trim().Trim('"')
  }
}
if ([string]::IsNullOrWhiteSpace($GameDir)) { throw 'Chua chon thu muc game.' }
$game = (Resolve-Path -LiteralPath $GameDir).Path
if (-not (IsGame $game)) { throw 'Thieu index.html, js/main.js hoac js/render.js trong thu muc da chon.' }
$index = Join-Path $game 'index.html'
$bridge = Join-Path $game 'vli-pc-v24\bridge.js'
$controls = Join-Path $game 'vli-pc-v24\controls-v24-2.js'
if (!(Test-Path -LiteralPath $bridge -PathType Leaf) -or !(Test-Path -LiteralPath $controls -PathType Leaf)) {
  throw 'Chua cai UI PC V24.2/V24.3. Hay cai giao dien PC truoc khi cap nhat V24.8.'
}
$target = Join-Path $game $folderName
$backup = Join-Path $game $backupName
if ($Restore) {
  if (!(Test-Path -LiteralPath $backup)) { throw 'Khong co du lieu sao luu V24.8.' }
  $latest = Get-ChildItem -LiteralPath $backup -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if (!$latest) { throw 'Khong tim thay lan cai de khoi phuc.' }
  $saved = Join-Path $latest.FullName 'index.html'
  if (!(Test-Path -LiteralPath $saved -PathType Leaf)) { throw 'Sao luu index.html khong con.' }
  Copy-Item -LiteralPath $saved -Destination $index -Force
  if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
  $old = Join-Path $latest.FullName 'old-v248'
  if (Test-Path -LiteralPath $old) { Copy-Item -LiteralPath $old -Destination $target -Recurse -Force }
  Write-Host 'DA KHOI PHUC UI TRUOC V24.8. KHONG DONG VAO SAVE/GAMEPLAY.' -ForegroundColor Green
  exit 0
}
if (!(Test-Path -LiteralPath $source -PathType Container)) { throw 'Thieu PATCH_DATA trong goi cai.' }
$jsName = 'classic-ui-v248.js'
$cssName = 'classic-ui-v248.css'
$js = Join-Path $source $jsName
$css = Join-Path $source $cssName
foreach ($file in @($js, $css, (Join-Path $source 'assets\pc-emoticons-reference.png'),
    (Join-Path $source 'assets\pc-emotes-9x8.png'), (Join-Path $source 'assets\pc-chat-entry-strip.png'),
    (Join-Path $source 'assets\pc-shop-empty-cell.png'))) {
  if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw ('Thieu file: ' + $file) }
  if ((Get-Item -LiteralPath $file).Length -lt 1000) { throw ('File khong day du: ' + $file) }
}
if ((Get-Item -LiteralPath $js).Length -lt 13000 -or (Get-Item -LiteralPath $css).Length -lt 8000) {
  throw 'JS/CSS co dau hieu bi cat hoac trong. Chua cai dat.'
}
$srcJsCode = [IO.File]::ReadAllText($js)
if (!$srcJsCode.Contains('VLI_PC_UI_V248') -or !$srcJsCode.Contains('24.8.0')) {
  throw 'Ma JavaScript khong dung ban V24.8.'
}
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  & $node.Source --check $js
  if ($LASTEXITCODE -ne 0) { throw 'JS co loi cu phap. Da dung truoc khi sua game.' }
}
# Compare only actual SOURCE/TARGET folder paths. Installing a patch from under game is safe
# because each payload child is copied to a different sibling path, with no recursive overlap.
$srcFull = [IO.Path]::GetFullPath($source).TrimEnd('\')
$dstFull = [IO.Path]::GetFullPath($target).TrimEnd('\')
if ($srcFull.Equals($dstFull,[StringComparison]::OrdinalIgnoreCase) -or
    $srcFull.StartsWith($dstFull+'\',[StringComparison]::OrdinalIgnoreCase) -or
    $dstFull.StartsWith($srcFull+'\',[StringComparison]::OrdinalIgnoreCase)) {
  throw 'Nguon va dich thuc su trung lap. Khong ghi de de tranh mat file.'
}
$html = [IO.File]::ReadAllText($index)
if ($html -notmatch '(?i)vli-pc-v24/bridge\.js' -or $html -notmatch '(?i)vli-pc-v24/controls-v24-2\.js') {
  throw 'index.html chua nap giao dien PC V24.2/V24.3.'
}
if ($html -notmatch '(?i)</head>' -or $html -notmatch '(?i)</body>') {
  throw 'index.html thieu the </head> hoac </body>.'
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss_fff'
$saveAt = Join-Path $backup $stamp
New-Item -ItemType Directory -Path $saveAt -Force | Out-Null
Copy-Item -LiteralPath $index -Destination (Join-Path $saveAt 'index.html')
$hadOld = Test-Path -LiteralPath $target
if ($hadOld) { Copy-Item -LiteralPath $target -Destination (Join-Path $saveAt 'old-v248') -Recurse -Force }
try {
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Copy-Item -LiteralPath $js -Destination (Join-Path $target $jsName) -Force
  Copy-Item -LiteralPath $css -Destination (Join-Path $target $cssName) -Force
  New-Item -ItemType Directory -Path (Join-Path $target 'assets') -Force | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $source 'assets') -File | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $target 'assets') -Force
  }
  if ((Get-Item -LiteralPath (Join-Path $target $jsName)).Length -lt 13000) { throw 'JS sau khi cai khong day du.' }
  $html = [regex]::Replace($html, '(?is)<link\b[^>]*vli-pc-ui-v248/classic-ui-v248\.css[^>]*>\s*', '')
  $html = [regex]::Replace($html, '(?is)<script\b[^>]*vli-pc-ui-v248/classic-ui-v248\.js[^>]*></script>\s*', '')
  $cssTag = '<link rel="stylesheet" href="vli-pc-ui-v248/classic-ui-v248.css?v=24.8.0">'
  $jsTag = '<script src="vli-pc-ui-v248/classic-ui-v248.js?v=24.8.0"></script>'
  $i = $html.LastIndexOf('</head>',[StringComparison]::OrdinalIgnoreCase)
  $html = $html.Insert($i, $cssTag + [Environment]::NewLine)
  $i = $html.LastIndexOf('</body>',[StringComparison]::OrdinalIgnoreCase)
  $html = $html.Insert($i, $jsTag + [Environment]::NewLine)
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($index,$html,$utf8)
  $check = [IO.File]::ReadAllText($index)
  if ([regex]::Matches($check, 'vli-pc-ui-v248/classic-ui-v248\.js').Count -ne 1 -or
      [regex]::Matches($check, 'vli-pc-ui-v248/classic-ui-v248\.css').Count -ne 1) {
    throw 'Loi them the UI V24.8 hoac them trung lap.'
  }
  Write-Host ''
  Write-Host 'CAI DAT THANH CONG - VLI PC UI V24.8 CHAT + EMOTE + KY TRAN CAC' -ForegroundColor Green
  Write-Host ('Game: ' + $game)
  Write-Host ('UI JS bytes: ' + (Get-Item -LiteralPath (Join-Path $target $jsName)).Length)
  Write-Host ('UI CSS bytes: ' + (Get-Item -LiteralPath (Join-Path $target $cssName)).Length)
  Write-Host ('Backup: ' + $saveAt)
  Write-Host 'Mo game, Ctrl+F5. Console: VLI_PC_UI_V248.status()'
} catch {
  Copy-Item -LiteralPath (Join-Path $saveAt 'index.html') -Destination $index -Force
  if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
  $savedPatch = Join-Path $saveAt 'old-v248'
  if ($hadOld -and (Test-Path -LiteralPath $savedPatch)) { Copy-Item -LiteralPath $savedPatch -Destination $target -Recurse -Force }
  throw
}
