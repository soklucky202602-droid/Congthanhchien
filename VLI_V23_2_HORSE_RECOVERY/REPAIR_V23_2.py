#!/usr/bin/env python3
"""VLI V23.2: undo the problematic V23.1 script hook and validate real PC SPR files.

Does not touch saves, skills, character, localStorage, or game functions.
"""
import argparse
import datetime
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

VERSION = '23.2.0'
JS_NAME = 'vli-pc-horse-recovery-v23-2.js'
VIEWER = 'KIEM_TRA_NGUA_PC_V23_2.html'
TAG = f'<script src="js/{JS_NAME}?v={VERSION}"></script>'
DEPENDS = [
    'index.html', 'jxlook.js', 'js/jxparts.js',
    'js/vli-pc-horse-atlas-v15.js', 'js/vli-pc-horse-centers-v15-4.js',
    'js/vli-pc-horse-geometry-v15-3.js', 'js/vli-pc-horse-runtime.js'
]
TAG_RE = re.compile(r'\s*<script\b[^>]*src\s*=\s*["\'][^"\']*(?:vli-pc-horse-visual-fix-v23|vli-pc-horse-recovery-v23-2)\.js[^"\']*["\'][^>]*>\s*</script>', re.I | re.S)


def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda: f.read(1024 * 1024), b''):
            h.update(c)
    return h.hexdigest()


def root_from(user, bundle):
    candidates = []
    if user: candidates.append(Path(user.strip('"')).expanduser())
    candidates += [Path.cwd(), bundle.parent, bundle]
    for item in candidates:
        if (item / 'index.html').is_file(): return item.resolve()
        if item.is_dir():
            subs = [x for x in item.iterdir() if x.is_dir() and (x / 'index.html').is_file()]
            if len(subs) == 1: return subs[0].resolve()
    val = input('GAME FOLDER containing index.html: ').strip().strip('"')
    root = Path(val).expanduser()
    if not (root / 'index.html').is_file():
        raise RuntimeError('Cannot find index.html in: ' + val)
    return root.resolve()


def backup_prepare(root):
    backup = root / 'VLI_V23_2_HORSE_BACKUP'
    backup.mkdir(exist_ok=True)
    index = root / 'index.html'
    orig = backup / 'index.html.orig'
    if not orig.exists(): shutil.copy2(index, orig)
    for rel in (f'js/{JS_NAME}', VIEWER):
        dst = root / rel
        if dst.exists() and not (backup / rel).exists():
            (backup / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dst, backup / rel)
    return backup


def verify_asset_manifest(bundle, root):
    manifest = json.loads((bundle / 'PC_SPR_MANIFEST.json').read_text(encoding='utf-8'))
    rows = manifest['files']
    missing, wrong, good = [], [], []
    assetroot = bundle / 'ASSETS'
    shipping = assetroot.is_dir() and bool(list(assetroot.glob('img/jx/m/vli_pc_k*_st.png')))
    for row in rows:
        name = row['path']
        dst = root / name
        if not dst.is_file(): missing.append(row)
        elif dst.stat().st_size != row['size'] or sha(dst) != row['sha256']: wrong.append(row)
        else: good.append(row)
    return shipping,good,missing,wrong,rows


def install(root, bundle):
    missing = [x for x in DEPENDS if not (root / x).is_file()]
    if missing: raise RuntimeError('Game missing required V15 PC files: ' + ', '.join(missing))
    targetjs = root / 'js' / JS_NAME
    sourcejs = bundle / 'PATCH_DATA' / 'js' / JS_NAME
    viewer_src = bundle / 'PATCH_DATA' / VIEWER
    if not sourcejs.exists() or not viewer_src.exists(): raise RuntimeError('Patch files missing in package')
    shipping, good, missing, wrong, rows = verify_asset_manifest(bundle, root)
    if shipping:
        for entry in missing + wrong:
            src = bundle / 'ASSETS' / entry['path']
            if not src.is_file(): raise RuntimeError('Pack missing sprite: ' + entry['path'])
            if src.stat().st_size != entry['size'] or sha(src) != entry['sha256']:
                raise RuntimeError('Sprite integrity check failed: ' + entry['path'])
    backup = backup_prepare(root)
    original_data = (backup / 'index.html.orig').read_bytes()
    old_restore = backup / 'V23_2_manifest.json'
    prev = json.loads(old_restore.read_text(encoding='utf8')) if old_restore.is_file() else {}
    old = set(prev.get('added_sprites', []))
    overwritten = set(prev.get('replaced_sprites', []))
    added_count = changed_count = 0
    if shipping:
        for entry in missing + wrong:
            rel=entry['path']; src=bundle / 'ASSETS' / rel; dst=root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if dst.exists() and rel not in overwritten and rel not in old:
                saved = backup / 'original_sprites' / rel
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, saved)
                overwritten.add(rel)
            if not dst.exists(): old.add(rel);added_count += 1
            else: changed_count += 1
            if src.resolve()!=dst.resolve():shutil.copy2(src,dst)
    html = (root / 'index.html').read_text(encoding='utf-8-sig')
    html = TAG_RE.sub('', html)
    if len(re.findall(r'</body\s*>', html, re.I)) != 1: raise RuntimeError('Could not locate unique </body>')
    html = re.sub(r'(?i)</body\s*>', '\n' + TAG + '\n</body>', html, count=1)
    assert html.count(TAG)==1
    targetjs.parent.mkdir(exist_ok=True)
    shutil.copy2(sourcejs, targetjs)
    shutil.copy2(viewer_src, root / VIEWER)
    tmp=root/'index.html.v23-2.tmp'
    tmp.write_text(html,encoding='utf-8')
    tmp.replace(root/'index.html')
    shipping_after, good_after, missing_after, wrong_after, _ = verify_asset_manifest(bundle, root)
    result = {
        'version':VERSION, 'root':str(root), 'installed_at':datetime.datetime.now().isoformat(),
        'source_index_sha256':hashlib.sha256(original_data).hexdigest(),
        'removed_v23_1_strict_mapper':True, 'legacy_mapper_k0_k33_preserved':True, 'expanded_exact_row_mapping_enabled':True,
        'gameplay_changed':False, 'saves_changed':False,'game_address':'http://127.0.0.1:8765/index.html',
        'asset_package_included':shipping, 'asset_files_expected':len(rows),
        'asset_files_ok':len(good_after), 'missing_count':len(missing_after), 'changed_count':len(wrong_after),
        'sprites_added':added_count, 'sprites_replaced':changed_count,
        'asset_files_missing': [i['path'] for i in missing_after[:30]],
        'asset_files_incorrect': [i['path'] for i in wrong_after[:30]],
        'missing_original_pc_animations':['K33'], 'note':'K33 original mounted sprite set not provided; no incorrect substitution performed.'
    }
    (root / 'VLI_V23_2_HORSE_REPORT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    restore_manifest = {
        'version':VERSION, 'created_at':prev.get('created_at') or datetime.datetime.now().isoformat(),
        'js_existed':prev.get('js_existed', (backup / f'js/{JS_NAME}').exists()),
        'viewer_existed':prev.get('viewer_existed', (backup / VIEWER).exists()),
        'added_sprites':sorted(old), 'replaced_sprites':sorted(overwritten)
    }
    old_restore.write_text(json.dumps(restore_manifest,indent=2),encoding='utf8')
    print('[OK] V23.2 recovery installed in:',root)
    print('Fixed: removed V23.1 strict JS override, old K0-K33 mapping preserved; exact K34-K75 mapping enabled.')
    print(f'Actual PC sprite PNG: {len(good_after)}/{len(rows)} verified. Copied {added_count}, repaired {changed_count}.')
    if missing_after or wrong_after:
        print('[WARNING] Missing or incorrect sprite PNG. Install FULL ASSET V23.2 package for K34-K75.')
    print('Open: http://127.0.0.1:8765/index.html  (use Ctrl + F5)')
    print('F12 > Console: VLI_PC_HORSE_RECOVERY_232.status()')
    print('Viewer: http://127.0.0.1:8765/KIEM_TRA_NGUA_PC_V23_2.html')
    print('Backup:',backup)


def rollback(root):
    b=root/'VLI_V23_2_HORSE_BACKUP'
    fn=b/'index.html.orig'
    mf=b/'V23_2_manifest.json'
    if not fn.is_file() or not mf.is_file():raise RuntimeError('No recovery backup at '+str(b))
    m=json.loads(mf.read_text(encoding='utf-8'))
    for rel in m.get('replaced_sprites',[]):
        src=b/'original_sprites'/rel
        if not src.is_file():raise RuntimeError('Backup sprite missing: '+str(src))
    shutil.copy2(fn,root/'index.html')
    for rel, flag in ((f'js/{JS_NAME}',m['js_existed']),(VIEWER,m['viewer_existed'])):
        dst=root/rel
        if flag:shutil.copy2(b/rel,dst)
        elif dst.exists():dst.unlink()
    for rel in m.get('added_sprites',[]):
        dst=root/rel
        if dst.is_file():dst.unlink()
    for rel in m.get('replaced_sprites',[]):
        src=b/'original_sprites'/rel
        dst=root/rel
        shutil.copy2(src,dst)
    print('[OK] Rolled back V23.2; note prior V23.1 may be active again.')
    print('No saves modified.')


def main():
    p=argparse.ArgumentParser()
    p.add_argument('game',nargs='?')
    p.add_argument('--rollback',action='store_true')
    args=p.parse_args()
    bundle=Path(__file__).resolve().parent
    root=root_from(args.game,bundle)
    if args.rollback:rollback(root)
    else:install(root,bundle)

if __name__=='__main__':
    try: main()
    except Exception as e:print('[ERROR]',str(e),file=sys.stderr);sys.exit(1)
