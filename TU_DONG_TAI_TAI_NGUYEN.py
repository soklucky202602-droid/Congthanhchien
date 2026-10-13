#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download public, authorized VoLamIdle static assets with safe rate limiting.

Stdlib-only. Never reads/stores credentials, cookies, session tokens or player data.
Keeps a record of confirmed HTTP 404 paths and supports interrupted downloads.
"""
from __future__ import annotations

from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path, PurePosixPath
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from threading import Lock
import argparse
import json
import os
import random
import shutil
import sys
import time
import zipfile

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / 'ASSET_MANIFEST.json'
STATUS = ROOT / 'TRANG_THAI_THU_THAP.json'
REPORT = ROOT / 'BAO_CAO_TU_DONG.txt'
MISSING = ROOT / 'DANH_SACH_CHUA_LAY_DUOC.txt'
DEFAULT_BASE = 'https://volamidle.pages.dev/'
VALID = {'.jpg', '.jpeg', '.png', '.webp', '.ogg', '.mp3', '.wav'}
MAX_FILE = 15 * 1024 * 1024
BATCH_PACK_BYTES = 160 * 1024 * 1024
lock = Lock()


def safe_name(name):
    if not isinstance(name, str) or len(name) > 300 or '\\' in name or '%' in name or '?' in name or '#' in name:
        return False
    p=PurePosixPath(name)
    if p.is_absolute() or p.suffix.lower() not in VALID or not len(p.parts):
        return False
    return all(seg not in ('','.','..') for seg in p.parts) and len(p.parts)<12


def load_status():
    if not STATUS.exists():return {}
    try:
        o=json.loads(STATUS.read_text('utf-8'))
        return o if isinstance(o,dict) else {}
    except Exception:return {}


def write_json_atomic(path,data):
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=1),encoding='utf-8')
    os.replace(tmp,path)


def total_binary_size():
    return sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in VALID)


def call_site_home(base):
    req=Request(base,headers={'User-Agent':'Mozilla/5.0 (compatible; OfflineAssetBackup/1.0)'})
    with urlopen(req,timeout=12) as resp:
        status=getattr(resp,'status',200)
        if status!=200:raise RuntimeError('Trang web khong tra ve 200: '+str(status))
        chunk=resp.read(500)
        if not chunk:raise RuntimeError('Trang web khong tra noi dung')
    return True


class RateLimiter:
    def __init__(self,rps):
        self.gap=1.0/max(rps,.2)
        self.next=0.0
        self.lock=Lock()
    def wait(self):
        with self.lock:
            t=time.monotonic()
            delay=max(0,self.next-t)
            self.next=max(self.next,t)+self.gap
        if delay:time.sleep(delay)


def get_asset(name,base,limiter):
    url=urljoin(base,name)
    local=ROOT.joinpath(*PurePosixPath(name).parts)
    for attempt in range(3):
        limiter.wait()
        try:
            req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; AuthorizedStaticAssetBackup/1.0)','Accept':'image/avif,image/webp,image/png,image/jpeg,audio/*,*/*;q=0.5'})
            with urlopen(req,timeout=24) as resp:
                status=getattr(resp,'status',200)
                if status!=200:return name,'http_'+str(status),0
                kind=resp.headers.get('Content-Type','').lower()
                if 'text/html' in kind:return name,'not_asset_html',0
                if 'application/json' in kind:return name,'not_asset_json',0
                content_length=resp.headers.get('Content-Length')
                if content_length and int(content_length)>MAX_FILE:return name,'too_large',0
                content=resp.read(MAX_FILE+1)
                if len(content)>MAX_FILE:return name,'too_large',0
                if len(content)<50:return name,'too_small',0
                ext=local.suffix.lower()
                if ext=='.png' and content[:8]!=b'\x89PNG\r\n\x1a\n':return name,'not_png',0
                if ext=='.webp' and not(content[:4]==b'RIFF' and content[8:12]==b'WEBP'):return name,'not_webp',0
                if ext in ('.jpg','.jpeg') and not content.startswith(b'\xff\xd8'):return name,'not_jpeg',0
            local.parent.mkdir(parents=True,exist_ok=True)
            tmp=local.with_name(local.name+'.part')
            tmp.write_bytes(content)
            os.replace(tmp,local)
            return name,'ok',len(content)
        except HTTPError as e:
            if e.code in (403,404,410):return name,'http_'+str(e.code),0
            if e.code in (429,500,502,503,504):
                if attempt<2:
                    time.sleep(min(9,2.5*(attempt+1)+random.uniform(.3,1.5)))
                    continue
                return name,'http_'+str(e.code),0
            return name,'http_'+str(e.code),0
        except (OSError,URLError,TimeoutError,ValueError) as e:
            if attempt<2:
                time.sleep(1.0*(attempt+1))
                continue
            return name,'network_error_'+type(e).__name__,0
    return name,'retry_exhausted',0


def zip_downloads(files):
    """Pack all available catalogued assets, preserving content across resumed runs."""
    chunks=[];chunk=[];total=0
    for name in sorted(files):
        p=ROOT / name
        if not p.exists() or not p.is_file():continue
        n=p.stat().st_size
        if total+n > BATCH_PACK_BYTES and chunk:
            chunks.append(chunk);chunk=[];total=0
        chunk.append(name);total+=n
    if chunk:chunks.append(chunk)
    packs=[]
    for stale in ROOT.glob('VoLamIdle_TAI_BO_SUNG_PHAN_*.zip'):
        try:stale.unlink()
        except OSError:pass
    for i,items in enumerate(chunks,1):
        fn='VoLamIdle_TAI_BO_SUNG_PHAN_%02d.zip'%i
        path=ROOT/fn
        with zipfile.ZipFile(path,'w',allowZip64=True) as z:
            for n in items:z.write(ROOT/n,n,compress_type=zipfile.ZIP_STORED)
            if i==1 and REPORT.exists():z.write(REPORT,'BAO_CAO_TU_DONG.txt',compress_type=zipfile.ZIP_DEFLATED)
        packs.append(path)
    return packs


def main():
    ap=argparse.ArgumentParser(description='Vo Lam Idle authorized offline asset mirroring')
    ap.add_argument('--core-only',action='store_true',help='Only the first 1940 prioritized assets')
    ap.add_argument('--base',default=DEFAULT_BASE,help='Website base URL (testing override)')
    ap.add_argument('--workers',type=int,default=4)
    ap.add_argument('--rate',type=float,default=4.0,help='Max requests per second to site')
    ap.add_argument('--max-items',type=int,default=0,help='Testing/diagnostic limit')
    ap.add_argument('--no-package',action='store_true')
    args=ap.parse_args()
    base=args.base.rstrip('/')+'/'
    data=json.loads(MANIFEST.read_text('utf-8'))
    core=list(data.get('core',[]));extra=[] if args.core_only else list(data.get('extended',[]))
    seen=set();allnames=[]
    for name in core+extra:
        if safe_name(name) and name not in seen:
            allnames.append(name);seen.add(name)
    if args.max_items>0:allnames=allnames[:args.max_items]
    total=len(allnames)
    statuses=load_status() if base==DEFAULT_BASE else {}
    now=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print('\n=== VO LAM IDLE - TU THU THAP TAI NGUYEN (DA CO QUYEN SU DUNG) ===')
    print('Thoi gian:',now,'\nWebsite:',base)
    print('Danh sach:',len(core),'core +',len(extra),'atlas =',total,'duong dan')
    print('Khong thu thap: mat khau / tai khoan / cookies / ma phien dang nhap.')
    try:call_site_home(base)
    except Exception as e:
        print('\nKHONG KET NOI DUOC WEBSITE:',repr(e))
        print('Kiem tra Internet, tuong lua hoac thu lai sau. Khong thay doi du lieu hien co.')
        return 3
    print('Ket noi website: OK')
    existing=[];notfound=[];todo=[]
    for n in allnames:
        path=ROOT/n
        if path.is_file() and path.stat().st_size>50:
            existing.append(n)
        elif statuses.get(n) in ('http_404','http_410'):
            notfound.append(n)
        else:todo.append(n)
    print('Da co:',len(existing),'| 404 da ghi nho:',len(notfound),'| Can tai:',len(todo))
    if not todo:
        print('Khong co tep moi can tai.')
    started=time.monotonic();downloaded=[];errs=Counter();nbytes=0
    limiter=RateLimiter(args.rate)
    workers=max(1,min(6,args.workers))
    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures=[pool.submit(get_asset,n,base,limiter) for n in todo]
            for i,future in enumerate(as_completed(futures),1):
                n,state,size=future.result()
                statuses[n]=state
                if state=='ok':downloaded.append(n);nbytes+=size
                else:errs[state]+=1
                if i%25==0 or i==len(futures):
                    print('  %5d / %-5d | OK %5d | Loi %5d | Tai %.1f MB | %.0f s'%
                         (i,len(futures),len(downloaded),sum(errs.values()),nbytes/1048576,time.monotonic()-started),flush=True)
                    if base==DEFAULT_BASE:write_json_atomic(STATUS,statuses)
    except KeyboardInterrupt:
        if base==DEFAULT_BASE:write_json_atomic(STATUS,statuses)
        print('\nDa dung an toan. Chay lai file CMD se tiep tuc tai.')
        return 130
    if base==DEFAULT_BASE:write_json_atomic(STATUS,statuses)
    pending=[]
    for n in allnames:
        p=ROOT/n
        if not p.is_file() or p.stat().st_size<51:
            pending.append(n+' : '+str(statuses.get(n,'missing')))
    MISSING.write_text('\n'.join(pending)+'\n',encoding='utf-8')
    report=(
      'BAO CAO TAI TAI NGUYEN VO LAM IDLE\n'
      + 'Website: '+base+'\n'
      + 'Thoi gian: '+now+'\n'
      + 'Tong duong dan danh sach: '+str(total)+'\n'
      + 'Da co tu truoc: '+str(len(existing))+'\n'
      + 'Tai thanh cong moi: '+str(len(downloaded))+'\n'
      + 'Dung luong tai moi (MiB): %.2f\n'%(nbytes/1048576)
      + 'Chua tai duoc (bao gom 404): '+str(len(pending))+'\n'
      + 'Tong tai nguyen nhi phan hien co (MiB): %.2f\n'%(total_binary_size()/1048576)
      + 'Loi moi: '+json.dumps(errs,ensure_ascii=False)+'\n'
      + '\nKHONG THE XAC NHAN 100% CHO DEN KHI KIEM THU GAME THUC TE.\n'
      + 'Chuc nang may chu khong duoc thu thap.\n'
      + 'Tep con thieu: DANH_SACH_CHUA_LAY_DUOC.txt\n'
    )
    REPORT.write_text(report,encoding='utf-8')
    print('\n'+report)
    packable=[n for n in allnames if (ROOT/n).is_file() and (ROOT/n).stat().st_size>50]
    if not args.no_package and packable:
        packs=zip_downloads(packable)
        print('GOI FILE TAI NGUYEN DA CO (GUI LAI CHO CHATGPT DE TICH HOP):')
        for p in packs:print(' *',p.name,'(%.1f MB)'%(p.stat().st_size/1048576))
    if total_binary_size() < 150*1024*1024:
        print('\nDung luong hien co duoi 150MiB. Neu can HTML 1-file, chay TAO_LAI_HTML_1_FILE.cmd.')
    else:
        print('\nCo nhieu anh; nen chay game bang CHAY_GAME_OFFLINE.cmd trong folder. HTML 1-file co the qua nang.')
    print('\nHoan tat. Co the choi offline bang CHAY_GAME_OFFLINE.cmd.')
    return 0


if __name__=='__main__':
    sys.exit(main())
