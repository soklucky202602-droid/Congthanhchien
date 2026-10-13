from pathlib import Path
import re, base64, mimetypes, json, sys
ROOT=Path(__file__).resolve().parent
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'VoLamIdle_AdminCP_FULL_OFFLINE.html'
page=(ROOT/'index.html').read_text('utf8')

resources={}
for p in sorted(ROOT.rglob('*')):
    if p.is_file() and p.suffix.lower() in {'.png','.webp','.jpg','.jpeg','.gif','.mp3','.ogg','.wav'}:
        name=p.relative_to(ROOT).as_posix()
        mime=mimetypes.guess_type(name)[0] or 'application/octet-stream'
        resources[name]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
print('Embedding %d binary resources...' % len(resources),flush=True)
prefix='<script id="offline-assets">\nwindow.__VLI_ASSETS='+json.dumps(resources,ensure_ascii=True,separators=(',',':'))+';\n'
shim=r'''(function(){
 const res=window.__VLI_ASSETS;
 const norm=x=>String(x||'').replace(/^\.\//,'').replace(/^\//,'').split('?')[0];
 window.__vliAsset=x=>res[norm(x)]||x;
 const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 if(d&&d.set){Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){return d.set.call(this,window.__vliAsset(v));}});}
 const media=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');
 if(media&&media.set){Object.defineProperty(HTMLMediaElement.prototype,'src',{configurable:true,enumerable:media.enumerable,get:media.get,set:function(v){return media.set.call(this,window.__vliAsset(v));}});}
 const rawFetch=window.fetch.bind(window);
 window.fetch=function(input,init){const k=String(input&&input.url||input||'');if(/^ver\.json(?:\?|$)/.test(k))return Promise.resolve(new Response('{"v":541,"xp":1,"bt":false}',{status:200,headers:{'Content-Type':'application/json'}}));const uri=res[norm(k)];if(uri)return rawFetch(uri,init);return Promise.reject(new TypeError('Offline: no local resource '+k));};
 const ureg=/url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
 function fixStyle(t){return t.replace(ureg,(whole,q,key)=>{const x=res[norm(key)];return x?'url("'+x+'")':whole;});}
 function fixNode(el){if(!el||el.nodeType!==1)return;
  const arr=[el,...el.querySelectorAll('[style],img[src]')];
  for(const p of arr){if(p.tagName==='IMG'){const src=p.getAttribute('src');const u=src&&res[norm(src)];if(u&&src!==u)p.setAttribute('src',u);}const st=p.getAttribute('style');if(st&&st.includes('url(')){const ns=fixStyle(st);if(ns!==st)p.setAttribute('style',ns);}}
 }
 const observer=new MutationObserver(muts=>{for(const m of muts){if(m.type==='attributes')fixNode(m.target);else for(const n of m.addedNodes)fixNode(n);}});
 if(document.body){fixNode(document.body);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','src']});}
})();
'''
prefix+=shim+'\n</script>\n'
# Image directly in initial HTML.
page=re.sub(r'src="(img/[^"?]+)"',lambda m:'src="'+resources.get(m.group(1),m.group(1))+'"',page)

def repl_css(m):
    file=(m.group(1)).split('?')[0]
    path=ROOT/file
    if not path.exists():return ''
    css=path.read_text('utf8')
    css=re.sub(r'''url\(\s*(["']?)([^"')]+)\1\s*\)''',lambda a:'url("'+resources.get(a.group(2),a.group(2))+'")',css)
    return '<style data-file="'+file+'">\n'+css+'\n</style>'
page=re.sub(r'<link rel="stylesheet" href="([^"]+)">',repl_css,page)

first=re.search(r'<script\s+src="[^"]+"\s*></script>',page)
assert first
page=page[:first.start()]+prefix+page[first.start():]

def repl_js(m):
    script=m.group(1).split('?')[0]
    if script=='js/jxparts.js':
        pre=(ROOT/'jxlook.js').read_text('utf8').replace('</script','<\\/script')
        extra='<script data-file="jxlook.js">\n'+pre+'\n</script>\n'
    else:extra=''
    body=(ROOT/script).read_text('utf8').replace('</script','<\\/script')
    return extra+'<script data-file="'+script+'">\n'+body+'\n</script>'
page=re.sub(r'<script src="([^"]+)"></script>',repl_js,page)
page=page.replace('</head>','<meta name="color-scheme" content="dark">\n</head>')
OUT.write_text(page,encoding='utf8')
print('Created',OUT,'size',round(OUT.stat().st_size/1048576,1),'MiB')
