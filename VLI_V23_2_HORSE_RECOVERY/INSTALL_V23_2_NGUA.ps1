param([string]$GameDir = '', [switch]$Rollback)
$ErrorActionPreference='Stop'
$Version = '23.2.0'
$PatchJs='vli-pc-horse-recovery-v23-2.js'
$Viewer='KIEM_TRA_NGUA_PC_V23_2.html'
$Tag='<script src="js/vli-pc-horse-recovery-v23-2.js?v=23.2.0"></script>'
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
function Resolve-Game([string]$requested) {
  $dirs=@()
  if ($requested) {$dirs+=($requested.Trim('"'))}
  $dirs+=@((Get-Location).Path,(Split-Path $PSScriptRoot -Parent),$PSScriptRoot)
  foreach($q in $dirs){
    if(-not $q -or -not (Test-Path -LiteralPath $q -PathType Container)){continue}
    $full=(Resolve-Path -LiteralPath $q).Path
    if(Test-Path -LiteralPath (Join-Path $full 'index.html') -PathType Leaf){return $full}
    $sub=@(Get-ChildItem -LiteralPath $full -Directory -ErrorAction SilentlyContinue | Where-Object {Test-Path -LiteralPath (Join-Path $_.FullName 'index.html') -PathType Leaf})
    if($sub.Count -eq 1){return $sub[0].FullName}
  }
  $answer=(Read-Host 'Enter the game folder containing index.html').Trim('"')
  if(-not $answer -or -not (Test-Path -LiteralPath (Join-Path $answer 'index.html') -PathType Leaf)){throw "index.html not found: $answer"}
  return (Resolve-Path -LiteralPath $answer).Path
}
function Write-Utf8([string]$dest,[string]$str){[System.IO.File]::WriteAllText($dest,$str,$Utf8NoBom)}
function Read-Utf8([string]$source){return [System.IO.File]::ReadAllText($source,[System.Text.Encoding]::UTF8)}
try {
  $Root=Resolve-Game $GameDir
  $Backup=Join-Path $Root 'VLI_V23_2_HORSE_BACKUP'
  $Index=Join-Path $Root 'index.html'
  $DestJS=Join-Path (Join-Path $Root 'js') $PatchJs
  $DestViewer=Join-Path $Root $Viewer
  $PriorIndex=Join-Path $Backup 'index.html.orig'
  $RecordPath=Join-Path $Backup 'V23_2_manifest.json'
  if($Rollback){
    if(-not (Test-Path -LiteralPath $PriorIndex -PathType Leaf) -or -not (Test-Path -LiteralPath $RecordPath -PathType Leaf)) {throw 'V23.2 backup not found'}
    $record=Get-Content -LiteralPath $RecordPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach($rel in @($record.replaced_sprites)){
      if(-not (Test-Path -LiteralPath (Join-Path (Join-Path $Backup 'original_sprites') $rel) -PathType Leaf)){throw "Missing original sprite backup: $rel"}
    }
    Copy-Item -LiteralPath $PriorIndex -Destination $Index -Force
    if($record.js_existed){Copy-Item -LiteralPath (Join-Path $Backup ('js\'+$PatchJs)) -Destination $DestJS -Force}
    elseif(Test-Path -LiteralPath $DestJS){Remove-Item -LiteralPath $DestJS -Force}
    if($record.viewer_existed){Copy-Item -LiteralPath (Join-Path $Backup $Viewer) -Destination $DestViewer -Force}
    elseif(Test-Path -LiteralPath $DestViewer){Remove-Item -LiteralPath $DestViewer -Force}
    foreach($rel in @($record.added_sprites)){
      $dst=Join-Path $Root $rel
      if(Test-Path -LiteralPath $dst -PathType Leaf){Remove-Item -LiteralPath $dst -Force}
    }
    foreach($rel in @($record.replaced_sprites)){
      Copy-Item -LiteralPath (Join-Path (Join-Path $Backup 'original_sprites') $rel) -Destination (Join-Path $Root $rel) -Force
    }
    Write-Host '[OK] V23.2 rolled back, saves untouched. Previous V23.1 may become active again.'
    exit 0
  }
  $Dependencies=@('index.html','jxlook.js','js/jxparts.js','js/vli-pc-horse-atlas-v15.js','js/vli-pc-horse-centers-v15-4.js','js/vli-pc-horse-geometry-v15-3.js','js/vli-pc-horse-runtime.js')
  foreach($relative in $Dependencies){if(-not (Test-Path -LiteralPath (Join-Path $Root $relative) -PathType Leaf)){throw "Missing original PC horse game file: $relative"}}
  $SourceJs=Join-Path (Join-Path $PSScriptRoot 'PATCH_DATA\js') $PatchJs
  $SourceViewer=Join-Path (Join-Path $PSScriptRoot 'PATCH_DATA') $Viewer
  if(-not (Test-Path -LiteralPath $SourceJs) -or -not (Test-Path -LiteralPath $SourceViewer)){throw 'Patch data missing'}
  $AssetManifest=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PC_SPR_MANIFEST.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  $FullPack=Test-Path -LiteralPath (Join-Path $PSScriptRoot 'ASSETS\img\jx\m\vli_pc_k34_hb_st.png') -PathType Leaf
  $Good=0;$Need=@()
  foreach($item in $AssetManifest.files){
    $dst=Join-Path $Root $item.path
    if(-not (Test-Path -LiteralPath $dst -PathType Leaf)){$Need+=@($item);continue}
    $file=Get-Item -LiteralPath $dst
    if($file.Length -ne [long]$item.size -or (Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash.ToLowerInvariant() -ne [string]$item.sha256){$Need+=@($item)}
    else{$Good++}
  }
  if($FullPack){
    foreach($item in $Need){
      $src=Join-Path (Join-Path $PSScriptRoot 'ASSETS') $item.path
      if(-not (Test-Path -LiteralPath $src -PathType Leaf)){throw "Asset missing in FULL package: $($item.path)"}
      $f=Get-Item -LiteralPath $src
      if($f.Length -ne [long]$item.size -or (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash.ToLowerInvariant() -ne [string]$item.sha256){throw "Invalid source asset: $($item.path)"}
    }
  }
  if(-not (Test-Path -LiteralPath $Backup -PathType Container)){New-Item -ItemType Directory -Path $Backup | Out-Null}
  if(-not (Test-Path -LiteralPath $PriorIndex -PathType Leaf)){Copy-Item -LiteralPath $Index -Destination $PriorIndex}
  $ExistingJs=Test-Path -LiteralPath $DestJS -PathType Leaf
  $ExistingViewer=Test-Path -LiteralPath $DestViewer -PathType Leaf
  if($ExistingJs -and -not (Test-Path -LiteralPath (Join-Path $Backup ('js\'+$PatchJs)))){
    New-Item -ItemType Directory -Path (Join-Path $Backup 'js') -Force | Out-Null
    Copy-Item -LiteralPath $DestJS -Destination (Join-Path $Backup ('js\'+$PatchJs))
  }
  if($ExistingViewer -and -not (Test-Path -LiteralPath (Join-Path $Backup $Viewer))){Copy-Item -LiteralPath $DestViewer -Destination (Join-Path $Backup $Viewer)}
  $PriorRecord=if(Test-Path -LiteralPath $RecordPath){Get-Content -LiteralPath $RecordPath -Raw -Encoding UTF8 | ConvertFrom-Json}else{$null}
  $Added=New-Object 'System.Collections.Generic.HashSet[string]'
  $Replaced=New-Object 'System.Collections.Generic.HashSet[string]'
  if($PriorRecord){foreach($n in @($PriorRecord.added_sprites)){[void]$Added.Add([string]$n)};foreach($n in @($PriorRecord.replaced_sprites)){[void]$Replaced.Add([string]$n)}}
  $Copied=0
  if($FullPack){
    foreach($item in $Need){
      $rel=[string]$item.path
      $dst=Join-Path $Root $rel
      $src=Join-Path (Join-Path $PSScriptRoot 'ASSETS') $rel
      if(Test-Path -LiteralPath $dst -PathType Leaf){
        if(-not $Added.Contains($rel) -and -not $Replaced.Contains($rel)){
          $save=Join-Path (Join-Path $Backup 'original_sprites') $rel
          New-Item -ItemType Directory -Path (Split-Path $save -Parent) -Force | Out-Null
          Copy-Item -LiteralPath $dst -Destination $save -Force
          [void]$Replaced.Add($rel)
        }
      } else {[void]$Added.Add($rel)}
      New-Item -ItemType Directory -Path (Split-Path $dst -Parent) -Force | Out-Null
      Copy-Item -LiteralPath $src -Destination $dst -Force
      $Copied++
    }
  }
  $Html=Read-Utf8 $Index
  $Html=[regex]::Replace($Html,'(?is)\s*<script\b[^>]*src\s*=\s*["''][^"'']*(?:vli-pc-horse-visual-fix-v23|vli-pc-horse-recovery-v23-2)\.js[^"'']*["''][^>]*>\s*</script>','')
  $BodyTags=[regex]::Matches($Html,'(?i)</body\s*>')
  if($BodyTags.Count -ne 1){throw 'index.html must contain exactly one </body>'}
  $pos=$BodyTags[0].Index
  $Html=$Html.Substring(0,$pos)+"`r`n"+$Tag+"`r`n"+$Html.Substring($pos)
  Copy-Item -LiteralPath $SourceJs -Destination $DestJS -Force
  Copy-Item -LiteralPath $SourceViewer -Destination $DestViewer -Force
  Write-Utf8 $Index $Html
  $Started=(Get-Date).ToString('s')
  $JsWasThere=[bool]$ExistingJs
  $ViewerWasThere=[bool]$ExistingViewer
  if($PriorRecord){
    $Started=[string]$PriorRecord.created_at
    $JsWasThere=[bool]$PriorRecord.js_existed
    $ViewerWasThere=[bool]$PriorRecord.viewer_existed
  }
  $Record=@{
    version=$Version; created_at=$Started;
    js_existed=$JsWasThere;viewer_existed=$ViewerWasThere;
    added_sprites=@($Added);replaced_sprites=@($Replaced)
  }
  Write-Utf8 $RecordPath ($Record|ConvertTo-Json -Depth 5)
  $MissingCount=$Need.Count
  if($FullPack){$MissingCount=0}
  $Status=@{version=$Version;root=$Root;installed_at=(Get-Date).ToString('s');removed_v23_1_strict_mapper=$true;
    gameplay_changed=$false;saves_changed=$false;asset_package_included=[bool]$FullPack;
    sprite_expected=$AssetManifest.files.Count;sprite_verified=$Good+$Copied;sprite_repaired=$Copied;
    missing_remaining=$MissingCount;missing_original_pc_animations=@('K33');origin='http://127.0.0.1:8765'}
  Write-Utf8 (Join-Path $Root 'VLI_V23_2_HORSE_REPORT.json') ($Status | ConvertTo-Json -Depth 5)
  Write-Host "[OK] V23.2 installed: $Root"
  Write-Host '[OK] Removed strict V23.1 horse override, preserved game logic.'
  Write-Host "PC sprite PNG: $($Good+$Copied)/$($AssetManifest.files.Count) checked; copied or corrected $Copied"
  if(-not $FullPack -and $Need.Count -gt 0){Write-Host "[WARNING] $($Need.Count) PC sprite PNG are missing/incorrect. Use FULL ASSET V23.2 package!" -ForegroundColor Yellow}
  Write-Host 'Game URL: http://127.0.0.1:8765/index.html (Ctrl+F5)'
  Write-Host 'Diagnostic: VLI_PC_HORSE_RECOVERY_232.status()'
  Write-Host 'Viewer: http://127.0.0.1:8765/KIEM_TRA_NGUA_PC_V23_2.html'
  exit 0
}catch{
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
