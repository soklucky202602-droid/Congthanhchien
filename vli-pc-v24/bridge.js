/* VLI V24.1 PC CLIENT UI -> VO LAM IDLE OFFLINE.
 * Visual shell derived from the separately tested V24 UI-only client.
 * Never creates/replaces a gameplay save or modifies S/R battle logic.
 * All actual game actions are delegated to existing V6+ functions/DOM.
 */
(() => {
  'use strict';
  const VERSION = '24.1.0-game-integrated';
  if (window.VLI_PC_UI_V24_INTEGRATION) return;
  if (!document.getElementById('battle') || !document.getElementById('arena') ||
      !document.getElementById('panel') || !window.VLI_PC_V24_SHELL) {
    console.error('[PC V24] Game source or UI shell missing');
    return;
  }
  const wrap = document.createElement('div');
  wrap.id = 'vli-pc-v24';
  wrap.innerHTML = window.VLI_PC_V24_SHELL;
  document.body.appendChild(wrap);
  const ui = wrap.querySelector('.pc-desktop');
  const windowLayer = ui.querySelector('.window-layer');
  const gamePanel = document.getElementById('panel');
  const nativeModal = document.getElementById('modal');
  const toastEl = ui.querySelector('.toast');
  const find = id => ui.querySelector('#pcv24-' + id);
  const oldTabParents = new Map();
  const opened = new Map();
  const listeners = new Map();
  let ztop = 30, toastTimer = null, currentChatChannel = 'Tất cả';
  let enabled = true, lastLogKey = null, lastStatsKey = null, minibuf = null;
  const ASSETS = 'vli-pc-v24/assets/';
  const PC = ASSETS + 'pc-v22/';
  const V21 = ASSETS + 'pc-v21/';
  const SKINS = {
    inventory:{title:'Hành trang',image:PC+'pc-original-inventory.webp',width:214,height:454,tab:'inv',side:340},
    character:{title:'Nhân vật',image:PC+'pc-original-character.webp',width:428,height:430,tab:'char',side:342},
    skills:{title:'Võ công',image:PC+'pc-original-martial-skills.webp',width:205,height:376,tab:'skill',side:350},
    quests:{title:'Nhiệm vụ',width:458,height:490,tab:'quest'},
    team:{title:'Tổ đội',image:PC+'pc-original-team.webp',width:433,height:300,gameAction:'team'},
    trade:{title:'Giao dịch',image:PC+'pc-original-trade-grid.webp',width:428,height:376},
    chest:{title:'Rương đồ',image:V21+'native-pc-chest.webp',width:223,height:419,gameAction:'chest'},
    system:{title:'Hệ thống',image:PC+'pc-original-options-panel.webp',width:205,height:252,tab:'more',side:375},
    guild:{title:'Bang hội',width:430,height:365},
    shop:{title:'Cửa hàng',width:460,height:420,gameAction:'shop'},
    friends:{title:'Hảo hữu',width:320,height:345},
    forge:{title:'Lò rèn',width:470,height:490,tab:'forge'},
    map:{title:'Bản đồ',width:440,height:370},
    help:{title:'Điều khiển',width:360,height:325},
    messages:{title:'Tin nhắn',image:V21+'native-pc-message.webp',width:154,height:119}
  };
  function event(name,payload){for(const fn of listeners.get(name)||[]){try{fn(payload)}catch(e){console.warn('[PC V24 listener]',e)}}}
  function on(name,fn){if(typeof fn!=='function')return()=>{};if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name).delete(fn);}
  function toast(msg){if(!toastEl)return;clearTimeout(toastTimer);toastEl.textContent=String(msg);toastEl.classList.add('visible');toastTimer=setTimeout(()=>toastEl.classList.remove('visible'),2800);}
  function missing(name){toast(name + ' — đã có vị trí trên UI, sẽ nối chức năng ở phiên bản sau.');event('pending',{name});}
  function gameReady(){try{return typeof S!=='undefined' && !!S && !!S.fac}catch(_){return false}}
  function tryCall(name,...args){try{const f=window[name];return typeof f==='function'?{called:true,value:f(...args)}:{called:false};}catch(err){console.warn('[PC V24] '+name,err);toast(name+': '+String(err.message||err));return{called:true,error:String(err)}}}
  function nativeClick(selector){const el=document.querySelector(selector);if(!el)return false;try{el.click();return true}catch(err){console.warn('[PC V24] native click',selector,err);return false}}
  function gameAction(action){
    const original = {hp:'#bHp',mp:'#bMp',tp:'#bTp',ride:'#rideBtn',auto:'#ctrlBtn',music:'#rotBtn',tongkim:'#tkBtn',admin:'#vliacp-open',ktc:'#ktcBtn'};
    if(action==='team')return tryCall('ptModal').called||nativeClick('#tabRide');
    if(action==='chest')return tryCall('stashModal').called;
    if(action==='shop')return tryCall('shopModal').called||nativeClick('#bShop');
    if(action==='admin'){
      if(window.VLIAdminCP && typeof window.VLIAdminCP.open==='function'){window.VLIAdminCP.open();return true;}
      return nativeClick('[data-vliacp-open]')||nativeClick('#vliacp-open')||nativeClick('#vliacp-u20');
    }
    if(action==='tongkim')return nativeClick(original.tongkim)||tryCall('vliTkOpen').called||tryCall('tkOpenModal').called;
    if(action==='ktc')return nativeClick(original.ktc)||tryCall('ktcModal').called;
    if(action==='ride')return nativeClick(original.ride)||tryCall('toggleMount').called;
    if(action==='auto')return nativeClick(original.auto);
    if(action==='music')return tryCall('toggleRot').called||nativeClick(original.music);
    // The original HP/MP/teleport controls use pointerdown, not click.
    // Call their existing gameplay handlers so the PC HUD works without modifying combat.
    if(action==='hp')return tryCall('drinkNow','life').called;
    if(action==='mp')return tryCall('drinkNow','mana').called;
    if(action==='tp'){
      try { if(typeof R!=='undefined'&&R?.town)return tryCall('backFromTown').called; }catch(_){}
      return tryCall('goTown').called;
    }
    return false;
  }
  function focusedWindow(win){win.style.zIndex=String(++ztop);}
  function pressed(){ui.querySelectorAll('[data-open]').forEach(b=>b.setAttribute('aria-pressed',String(opened.has(b.dataset.open))));}
  function position(cfg,w,h){
    const W=ui.clientWidth,H=ui.clientHeight;
    let left=Math.max(5,Math.floor((W-w)/2)),top=Math.max(36,Math.min(115,H-h-96));
    const prev=[...opened.values()].at(-1);
    if(prev){const x=parseInt(prev.style.left,10)+prev.offsetWidth+10,y=parseInt(prev.style.top,10);if(x+w<W-8){left=x;top=y;}else if(left-70>=0){left=Math.max(5,left-70);top=Math.max(35,top+26);}}
    return {left,top};
  }
  function node(tag,cls){const el=document.createElement(tag);if(cls)el.className=cls;return el;}
  function labelStat(container,className,text){const el=node('span','native-stat '+className);el.textContent=text;container.append(el);return el;}
  function gameStatsForSkin(win,id){if(id!=='character')return;const s=gameReady()?S:null;
    labelStat(win,'char-name',s?.name||'');labelStat(win,'char-level',s?String(s.lvl):'');
  }
  function pendingContent(win,id){
    const el=node('div','pc-not-ready');
    const messages={
      trade:'Giao dịch: đã giữ nguyên khung PC. Chức năng trao đổi trực tiếp sẽ kết nối sau.',
      guild:'Bang hội: chưa có dữ liệu bang hội từ gameplay hiện tại.',
      friends:'Hảo hữu: danh sách bạn bè sẽ tích hợp sau.',
      messages:'Tin nhắn: chưa có hệ thống thư riêng trong bản offline.'
    };
    el.textContent=messages[id]||'Khung PC đã sẵn sàng; chức năng sẽ bổ sung sau.';
    win.append(el);
  }
  function fallbackMarkup(id){
    if(id==='map')return '<div class="map-large"></div><p class="small-caption">Bản đồ PC: minimap trên giao diện chính đang dùng hình dựng từ bản đồ game thật. Bảng bản đồ lớn sẽ bổ sung sau.</p>';
    if(id==='help')return '<div class="generic-row">C / I / K <b>Nhân vật / Túi / Võ công</b></div><div class="generic-row">G / B / O <b>Bang hội / Kho / Hệ thống</b></div><div class="generic-row">Q / T / F <b>Giữ phím gốc của game</b></div><div class="generic-row">Esc <b>Đóng cửa sổ PC</b></div><div class="generic-row">1 / 2 / 3, F1–F4 <b>Giữ điều khiển gốc của game</b></div><div class="generic-row">Alt + Shift + U <b>Bật/tắt UI PC</b></div><p class="small-caption">Những nút chưa có chức năng được giữ nguyên để tiếp tục phát triển.</p>';
    if(id==='guild')return '<div class="generic-row">Bang hội <b>Chưa kết nối gameplay</b></div><div class="native-actions"><button class="native-btn" type="button" data-pending="Lập bang">Lập bang</button><button class="native-btn" type="button" data-pending="Xin gia nhập">Xin gia nhập</button></div>';
    if(id==='friends')return '<div class="generic-row">Hảo hữu <b>Chưa kết nối gameplay</b></div><div class="native-actions"><button class="native-btn" type="button" data-pending="Thêm bạn">Thêm bạn</button></div>';
    return '<div class="generic-row">Giao diện Võ Lâm PC<b>Đang hoàn thiện chức năng</b></div>';
  }
  function attachGameTab(id,win,cfg){
    if(!cfg.tab)return false;
    const tab=document.getElementById('t-'+cfg.tab);
    if(!tab)return false;
    const owner=oldTabParents.get(tab);
    if(owner?.host && owner.host.isConnected && owner.id!==id)closePanel(owner.id);
    // Trigger the ORIGINAL tab renderer: skill/item buttons retain native handlers.
    const openedNative=tryCall('showTab',cfg.tab);
    if(!openedNative.called)nativeClick('#tabs button[data-t="'+cfg.tab+'"]');
    const host=node('div','pc-game-host');host.dataset.liveGameTab=cfg.tab;
    if(cfg.image){host.style.left=(cfg.width+2)+'px';host.style.top='6px';host.style.right='7px';host.style.bottom='7px';}
    else{host.style.left='11px';host.style.top='44px';host.style.right='11px';host.style.bottom='12px';}
    win.append(host);
    oldTabParents.set(tab,{parent:tab.parentNode,next:tab.nextSibling,host,id});
    host.append(tab);tab.classList.add('v24-live-tab');tab.classList.remove('hidden');
    return true;
  }
  function restoreGameTab(id){
    const cfg=SKINS[id];if(!cfg?.tab)return;
    const tab=document.getElementById('t-'+cfg.tab),item=tab&&oldTabParents.get(tab);
    if(!item)return;
    tab.classList.remove('v24-live-tab');
    if(item.next && item.next.parentNode===item.parent)item.parent.insertBefore(tab,item.next);
    else item.parent?.append(tab);
    oldTabParents.delete(tab);
    if(!gamePanel.querySelector('.tab:not(.hidden)')){
      const logTab=document.getElementById('t-log');if(logTab)logTab.classList.remove('hidden');
    }
  }
  function openPanel(id){
    const cfg=SKINS[id];if(!cfg){missing(id);return null;}
    if(opened.has(id)){focusedWindow(opened.get(id));return opened.get(id);}
    let w=cfg.width,h=cfg.height;
    if(cfg.tab&&cfg.image){w+=cfg.side||325;h=Math.max(h,440);}else if(cfg.tab)h=Math.max(h,440);
    const win=node('section','pc-window '+(cfg.image?'native':'generic')+(cfg.tab?' live':''));
    win.dataset.panel=id;win.setAttribute('aria-label',cfg.title);win.setAttribute('role','dialog');win.tabIndex=-1;
    win.style.width=Math.min(w,Math.max(300,ui.clientWidth-12))+'px';
    win.style.height=Math.min(h,Math.max(200,ui.clientHeight-112))+'px';
    const pos=position(cfg,win.offsetWidth||Math.min(w,ui.clientWidth-12),Math.min(h,ui.clientHeight-112));
    win.style.left=pos.left+'px';win.style.top=pos.top+'px';
    if(cfg.image){
      const backing=node('div','native-underlay');win.append(backing);
      const img=node('img','skin');img.src=cfg.image;img.alt='';img.draggable=false;
      if(cfg.tab){img.style.position='absolute';img.style.left='0';img.style.top='0';img.style.width=cfg.width+'px';img.style.height=cfg.height+'px';}
      win.append(img);
    }else if(!cfg.tab){
      const title=node('div','generic-title');title.textContent=cfg.title;
      const body=node('div','generic-body');body.innerHTML=fallbackMarkup(id);win.append(title,body);
    }else{
      const title=node('div','generic-title');title.textContent=cfg.title;win.append(title);
    }
    const drag=node('div','pc-window-head');drag.title='Kéo để di chuyển';win.append(drag);
    const close=node('button','pc-window-x');close.type='button';close.title='Đóng '+cfg.title;
    close.setAttribute('aria-label','Đóng '+cfg.title);close.addEventListener('click',()=>closePanel(id));win.append(close);
    if(cfg.image&&!cfg.tab){
      const f=node('button','pc-window-bottom-close');f.type='button';f.title='Đóng '+cfg.title;f.addEventListener('click',()=>closePanel(id));win.append(f);
      if(!cfg.gameAction)pendingContent(win,id);
    }
    windowLayer.append(win);opened.set(id,win);focusedWindow(win);pressed();
    win.addEventListener('pointerdown',()=>focusedWindow(win));
    drag.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();focusedWindow(win);
      const sx=e.clientX,sy=e.clientY,left=win.offsetLeft,top=win.offsetTop;
      drag.setPointerCapture(e.pointerId);
      const move=v=>{win.style.left=Math.max(0,Math.min(ui.clientWidth-45,left+v.clientX-sx))+'px';win.style.top=Math.max(0,Math.min(ui.clientHeight-42,top+v.clientY-sy))+'px';};
      const up=()=>{drag.removeEventListener('pointermove',move);drag.removeEventListener('pointerup',up);drag.removeEventListener('pointercancel',up);};
      drag.addEventListener('pointermove',move);drag.addEventListener('pointerup',up);drag.addEventListener('pointercancel',up);
    });
    if(cfg.tab){if(!attachGameTab(id,win,cfg)){pendingContent(win,id);}}
    else if(cfg.gameAction){if(!gameAction(cfg.gameAction))pendingContent(win,id);}
    if(id==='character')gameStatsForSkin(win,id);
    event('panel.open',{id,gameTab:cfg.tab||null});
    return win;
  }
  function closePanel(id){const win=opened.get(id);if(!win)return false;restoreGameTab(id);win.remove();opened.delete(id);pressed();event('panel.close',{id});return true;}
  function togglePanel(id){return opened.has(id)?closePanel(id):openPanel(id);}
  function closeTop(){let top=null;for(const win of opened.values())if(!top||Number(win.style.zIndex)>Number(top.style.zIndex))top=win;return top?closePanel(top.dataset.panel):false;}
  function toggleUI(next){enabled=next===undefined?!enabled:!!next;document.body.classList.toggle('vli-pc-ui-v24',enabled);wrap.style.display=enabled?'':'none';if(!enabled){for(const id of [...opened.keys()])closePanel(id);}
    try{if(typeof resizeArena==='function')requestAnimationFrame(resizeArena);}catch(e){console.warn('[PC V24] resize',e)}
    return enabled;}
  function pct(n,d){return Number(d)>0?Math.max(0,Math.min(100,100*Number(n||0)/Number(d))):0;}
  function updateHud(){
    let name='Đang vào game',lvl='—',hp='—',mp='—',xp='—';let hpPercent=0,mpPercent=0,xpPercent=0,zone='Bản đồ luyện công';
    try{
      const hasS=typeof S!=='undefined'&&S&&S.fac;
      if(hasS){
        name=S.name||document.getElementById('heroName')?.textContent||'Nhân vật';lvl=S.lvl||'—';
        if(typeof R!=='undefined'&&R?.P){const p=R.P;hp=Math.round(R.life||0)+'/'+Math.round(p.life||0);mp=Math.round(R.mana||0)+'/'+Math.round(p.mana||0);hpPercent=pct(R.life,p.life);mpPercent=pct(R.mana,p.mana);}
        const cap=typeof J!=='undefined'&&J?.exp?J.exp[S.lvl-1]||1:1;
        xpPercent=pct(S.xp,cap);xp=xpPercent.toFixed(2)+'%';
        if(typeof zoneOf==='function'){const limit=typeof STAGES==='number'?STAGES:S.stage;zone=zoneOf(Math.min(S.stage,limit)).n||zone;}
        if(typeof R!=='undefined'&&R?.town)zone='Thành thị';
        if(typeof R!=='undefined'&&R?.dg)zone=R.dg.d?.n||'Phó bản';
      }
    }catch(err){console.warn('[PC V24] HUD',err)}
    const key=[name,lvl,hp,mp,xp,zone].join('|');if(key===lastStatsKey)return;lastStatsKey=key;
    find('statName').textContent=name;find('statLevel').textContent='Cấp '+lvl;
    find('statHp').textContent=hp;find('statMp').textContent=mp;find('statXp').textContent=xp;
    for(const [cls,v] of [['hp',hpPercent],['mp',mpPercent],['xp',xpPercent]]){
      const bar=ui.querySelector('.pc-bar.'+cls+' span');if(bar)bar.style.width=v+'%';
    }
    const mapTitle=find('map-title');if(mapTitle){mapTitle.firstChild.textContent=zone+' ';const sub=mapTitle.querySelector('small');if(sub)sub.textContent='';}
    for(const win of opened.values())if(win.dataset.panel==='character'){
      const n=win.querySelector('.char-name'),l=win.querySelector('.char-level');if(n)n.textContent=name;if(l)l.textContent=lvl;
    }
  }
  function updateLog(){
    try{
      if(typeof R==='undefined'||!Array.isArray(R?.logs))return;
      const lines=R.logs.slice(0,28).reverse();const key=lines.length+'|'+lines.at(-1)+'|'+lines[0];if(key===lastLogKey)return;lastLogKey=key;
      const container=find('chatLog');if(!container)return;container.replaceChildren();
      for(const raw of lines){const el=node('div','c-white');const span=node('span');span.innerHTML=String(raw||'');el.textContent=span.textContent||String(raw||'');container.append(el);}
      if(!lines.length){const el=node('div','c-white');el.textContent='Chưa có nhật ký game';container.append(el);}
      container.scrollTop=container.scrollHeight;
    }catch(err){console.warn('[PC V24] game log',err)}
  }
  function updateMini(){
    try{
      const canvas=document.getElementById('arena');
      if(!canvas||!canvas.width||!canvas.height||typeof MINI==='undefined'||!MINI)return;
      const width=canvas.clientWidth,height=canvas.clientHeight;
      const x=Math.max(0,width-MINI.s-MINI.m),y=Math.max(0,MINI.top),size=MINI.s;
      if(!size||x+size>width+1||y+size>height+1)return;
      const scaleX=canvas.width/width,scaleY=canvas.height/height;
      const viewer=minibuf||ui.querySelector('.pc-live-mini');if(!viewer)return;
      const ctx=viewer.getContext('2d');if(!ctx)return;
      ctx.clearRect(0,0,viewer.width,viewer.height);
      ctx.drawImage(canvas,x*scaleX,y*scaleY,size*scaleX,size*scaleY,0,0,viewer.width,viewer.height);
      viewer.hidden=false;
    }catch(_){ /* Canvas can be temporarily unavailable during changing zones. */ }
  }
  function sendChat(msg){
    if(!msg.trim())return;
    if(currentChatChannel!=='Tất cả'){toast('Kênh '+currentChatChannel+' đang chờ tích hợp vào Võ Lâm Idle.');return;}
    const r=tryCall('chatSend',msg);
    if(r.called){toast('Đã chuyển tin nhắn đến chức năng chat của game (nếu đang kết nối).');return;}
    toast('Kênh chat chưa hoạt động ở chế độ offline này.');
  }
  function init(){
    // All native dialogs are moved unchanged above the V24 overlay so their existing handlers remain intact.
    if(nativeModal && nativeModal.parentNode!==document.body)document.body.appendChild(nativeModal);
    document.body.classList.add('vli-pc-ui-v24');
    minibuf=node('canvas','pc-live-mini');minibuf.width=170;minibuf.height=127;minibuf.hidden=true;
    const mini=find('minimap');if(mini)mini.append(minibuf);
    ui.addEventListener('click',e=>{
      const btn=e.target.closest('[data-open],[data-game],[data-demo],[data-pending]');
      if(!btn||!ui.contains(btn))return;
      if(btn.dataset.open)togglePanel(btn.dataset.open);
      else if(btn.dataset.game){if(!gameAction(btn.dataset.game))missing(btn.textContent.trim()||btn.dataset.game);}
      else missing(btn.dataset.pending||btn.dataset.demo||'Chức năng');
    });
    find('chatForm')?.addEventListener('submit',e=>{e.preventDefault();const inp=find('chatInput');const v=inp.value.trim();if(v){sendChat(v);inp.value='';}});
    ui.querySelectorAll('.mini-commands button').forEach(b=>{b.title=b.title||b.textContent.trim();});
    ui.querySelectorAll('.chat-channel').forEach(b=>b.addEventListener('click',()=>{
      currentChatChannel=b.dataset.channel;ui.querySelectorAll('.chat-channel').forEach(x=>x.classList.toggle('active',x===b));
    }));
    // Never intercept Q/T/F: these are ORIGINAL potion / teleport / auto-combat keys.
    const KEYS={c:'character',i:'inventory',k:'skills',g:'guild',b:'chest',o:'system'};
    document.addEventListener('keydown',e=>{
      if(!enabled||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey)return;
      if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      if(e.key==='Escape'){
        if(document.getElementById('modal')?.classList.contains('hidden')===false)return;
        if(closeTop()){e.preventDefault();e.stopImmediatePropagation();}return;
      }
      if(e.repeat)return;
      const panel=KEYS[String(e.key).toLowerCase()];if(!panel)return;
      e.preventDefault();e.stopImmediatePropagation();togglePanel(panel);
    },true);
    window.addEventListener('keydown',e=>{if(e.altKey&&e.shiftKey&&e.key.toLowerCase()==='u'){e.preventDefault();toggleUI();}},true);
    setInterval(()=>{if(enabled){updateHud();updateLog();updateMini();}},420);
    window.addEventListener('resize',()=>{try{if(typeof resizeArena==='function')resizeArena();}catch(_){}});
    requestAnimationFrame(()=>{try{if(typeof resizeArena==='function')resizeArena();}catch(err){console.warn('[PC V24] resize',err)}});
    updateHud();updateLog();
    console.info('[VLI PC V24.1] Real game UI bridge loaded',api.status());
  }
  const api={version:VERSION,openPanel,closePanel,togglePanel,toast,on,
    toggleUI,status:()=>({version:VERSION,installed:true,enabled,gameDetected:!!document.getElementById('arena'),
      gameReady:gameReady(),realArena:document.getElementById('arena')?.isConnected||false,
      openPanels:[...opened.keys()],skinWindows:Object.values(SKINS).filter(x=>x.image).length,
      realGameTabs:Object.values(SKINS).filter(x=>x.tab).map(x=>x.tab),
      gameplayModified:false,saveModified:false,staticBackground:false,
      note:'Original game functions reused; unfinished buttons stay visible. Not pixel-perfect PC.'}),
    auditAssets:async()=>{
      const files=Object.values(SKINS).filter(x=>x.image).map(x=>x.image).concat([PC+'pc-original-bottom-hud.webp']);
      return Promise.all(files.map(src=>new Promise(ok=>{const im=new Image();im.onload=()=>ok({src,ok:true});im.onerror=()=>ok({src,ok:false});im.src=src;})));
    }
  };
  window.VLI_PC_UI_V24_INTEGRATION=api;
  window.VLI_PC_CLIENT_UI=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
