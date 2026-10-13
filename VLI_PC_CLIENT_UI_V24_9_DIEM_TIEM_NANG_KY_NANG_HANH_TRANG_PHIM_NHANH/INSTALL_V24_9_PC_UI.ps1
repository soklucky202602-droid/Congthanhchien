param([string]$GameDir='', [switch]$Restore)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$folderName='vli-pc-ui-v249'
$payload=Join-Path $root ('PATCH_DATA\'+$folderName)
$backupName='_BACKUP_PC_UI_V24_9'
function IsGame([string]$path){
  if([string]::IsNullOrWhiteSpace($path)){return $false}
  return (Test-Path -LiteralPath (Join-Path $path 'index.html') -PathType Leaf) -and
    (Test-Path -LiteralPath (Join-Path $path 'js\main.js') -PathType Leaf) -and
    (Test-Path -LiteralPath (Join-Path $path 'js\render.js') -PathType Leaf)
}
if(-not $GameDir){
  $parent=Split-Path -Parent $root
  $grandparent=Split-Path -Parent $parent
  $candidates=@($root,$parent,$grandparent)
  foreach($dir in @($parent,$grandparent)){
    if(Test-Path -LiteralPath $dir){
      $candidates+=@(Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
    }
  }
  $found=@($candidates|Select-Object -Unique|Where-Object{IsGame $_})
  if($found.Count -eq 1){$GameDir=$found[0];Write-Host ('Tim thay thu muc game: '+$GameDir) -ForegroundColor Cyan}
  else{$GameDir=(Read-Host 'Nhap DUONG DAN thu muc game co index.html').Trim().Trim('"')}
}
if([string]::IsNullOrWhiteSpace($GameDir)){throw 'Chua chon thu muc game.'}
$game=(Resolve-Path -LiteralPath $GameDir).Path
if(-not(IsGame $game)){throw 'Sai thu muc game. Can index.html, js/main.js va js/render.js.'}
$index=Join-Path $game 'index.html'
$uiBridge=Join-Path $game 'vli-pc-v24\bridge.js'
$uiControls=Join-Path $game 'vli-pc-v24\controls-v24-2.js'
if(!(Test-Path -LiteralPath $uiBridge -PathType Leaf) -or !(Test-Path -LiteralPath $uiControls -PathType Leaf)){
  throw 'Can cai V24.3 PC Client UI truoc V24.9.'
}
$target=Join-Path $game $folderName
$backup=Join-Path $game $backupName
if($Restore){
  if(!(Test-Path -LiteralPath $backup)){throw 'Khong tim thay ban sao luu V24.9.'}
  $latest=Get-ChildItem -LiteralPath $backup -Directory|Sort-Object Name -Descending|Select-Object -First 1
  if(!$latest){throw 'Chua co ban sao luu V24.9.'}
  $saved=Join-Path $latest.FullName 'index.html'
  if(!(Test-Path -LiteralPath $saved -PathType Leaf)){throw 'Thieu index.html trong backup.'}
  Copy-Item -LiteralPath $saved -Destination $index -Force
  if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force}
  $old=Join-Path $latest.FullName 'old-patch'
  if(Test-Path -LiteralPath $old){Copy-Item -LiteralPath $old -Destination $target -Recurse -Force}
  Write-Host 'DA KHOI PHUC UI TRUOC V24.9 - KHONG THAY DOI SAVE GAME' -ForegroundColor Green
  exit 0
}
$srcJS=Join-Path $payload 'pc-controls-v249.js'
$srcCSS=Join-Path $payload 'pc-controls-v249.css'
foreach($f in @($srcJS,$srcCSS)){
  if(!(Test-Path -LiteralPath $f -PathType Leaf)){throw ('Thieu file trong ban va: '+$f)}
}
if((Get-Item -LiteralPath $srcJS).Length -lt 9500 -or (Get-Item -LiteralPath $srcCSS).Length -lt 4000){
  throw 'Ma JS/CSS khong day du. CHUA CAI.'
}
$code=[IO.File]::ReadAllText($srcJS)
if(!$code.Contains('VLI_PC_UI_V249') -or !$code.Contains('24.9.0') -or !$code.Contains('attrAddModal')){
  throw 'Sai noi dung ban va V24.9.'
}
$node=Get-Command node -ErrorAction SilentlyContinue
if($node){ & $node.Source --check $srcJS; if($LASTEXITCODE -ne 0){throw 'JavaScript sai cu phap. CHUA CAI.'} }
$srcFull=[IO.Path]::GetFullPath($payload).TrimEnd('\')
$dstFull=[IO.Path]::GetFullPath($target).TrimEnd('\')
# Do not disallow installing from INSIDE game: only reject actual source/destination overlap.
if($srcFull.Equals($dstFull,[StringComparison]::OrdinalIgnoreCase) -or
   $srcFull.StartsWith($dstFull+'\',[StringComparison]::OrdinalIgnoreCase) -or
   $dstFull.StartsWith($srcFull+'\',[StringComparison]::OrdinalIgnoreCase)){
   throw 'Source / target overlap. Khong duoc tu sao che thu muc vao chinh no.'
}
$html=[IO.File]::ReadAllText($index)
if($html -notmatch '(?i)vli-pc-v24/bridge\.js' -or
   $html -notmatch '(?i)vli-pc-v24/controls-v24-2\.js' -or
   $html -notmatch '(?i)</head>' -or $html -notmatch '(?i)</body>'){
   throw 'Khong tim thay PC UI V24.3 scripts hoac HTML thieu head/body.'
}
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss_fff'
$saveAt=Join-Path $backup $stamp
New-Item -ItemType Directory -Path $saveAt -Force|Out-Null
Copy-Item -LiteralPath $index -Destination (Join-Path $saveAt 'index.html')
$hadOld=Test-Path -LiteralPath $target
if($hadOld){Copy-Item -LiteralPath $target -Destination (Join-Path $saveAt 'old-patch') -Recurse -Force}
$utf8=New-Object System.Text.UTF8Encoding($false)
try{
  New-Item -ItemType Directory -Path $target -Force|Out-Null
  Copy-Item -LiteralPath $srcJS -Destination (Join-Path $target 'pc-controls-v249.js') -Force
  Copy-Item -LiteralPath $srcCSS -Destination (Join-Path $target 'pc-controls-v249.css') -Force
  if((Get-Item -LiteralPath (Join-Path $target 'pc-controls-v249.js')).Length -lt 9500){throw 'JS sau khi cai bi thieu.'}
  $html=[regex]::Replace($html,'(?is)<link\b[^>]*vli-pc-ui-v249/pc-controls-v249\.css[^>]*>\s*','')
  $html=[regex]::Replace($html,'(?is)<script\b[^>]*vli-pc-ui-v249/pc-controls-v249\.js[^>]*></script>\s*','')
  $cssTag='<link rel="stylesheet" href="vli-pc-ui-v249/pc-controls-v249.css?v=24.9.0">'
  $jsTag='<script src="vli-pc-ui-v249/pc-controls-v249.js?v=24.9.0"></script>'
  $pos=$html.LastIndexOf('</head>',[StringComparison]::OrdinalIgnoreCase)
  if($pos -lt 0){throw 'Khong tim thay </head>'}
  $html=$html.Insert($pos,$cssTag+[Environment]::NewLine)
  $pos=$html.LastIndexOf('</body>',[StringComparison]::OrdinalIgnoreCase)
  if($pos -lt 0){throw 'Khong tim thay </body>'}
  $html=$html.Insert($pos,$jsTag+[Environment]::NewLine)
  [IO.File]::WriteAllText($index,$html,$utf8)
  $check=[IO.File]::ReadAllText($index)
  if([regex]::Matches($check,'vli-pc-ui-v249/pc-controls-v249\.js').Count -ne 1 -or
     [regex]::Matches($check,'vli-pc-ui-v249/pc-controls-v249\.css').Count -ne 1){
    throw 'Trung lap hoac sai link script / CSS V24.9.'
  }
  Write-Host ''
  Write-Host 'CAI DAT THANH CONG - VO LAM IDLE H5 PC UI V24.9' -ForegroundColor Green
  Write-Host ('Game: '+$game)
  Write-Host ('JavaScript: '+(Get-Item -LiteralPath (Join-Path $target 'pc-controls-v249.js')).Length+' bytes')
  Write-Host ('CSS: '+(Get-Item -LiteralPath (Join-Path $target 'pc-controls-v249.css')).Length+' bytes')
  Write-Host ('Sao luu: '+$saveAt)
  Write-Host 'Mo game Ctrl+F5. F12: VLI_PC_UI_V249.status()'
}catch{
  Copy-Item -LiteralPath (Join-Path $saveAt 'index.html') -Destination $index -Force
  if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force}
  $old=Join-Path $saveAt 'old-patch'
  if($hadOld -and (Test-Path -LiteralPath $old)){Copy-Item -LiteralPath $old -Destination $target -Recurse -Force}
  throw
}
