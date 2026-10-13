/* Võ Lâm Idle H5 - PC Client controls V24.2.
 * UI integration only: all game mutations go through existing V6 handlers.
 * Does not change save, combat source, inventory rules or PC sprite assets.
 */
(() => {
  'use strict';
  const VERSION = '24.2.0';
  if (window.VLI_PC_UI_V24_CONTROLS) return;

  let ready = false, state = 'loading', err = null;
  let inventoryPage = 0, renderVersion = '', selectedSkill = null;
  let localNotes = [], localNotesId = 0;
  let mapZoom = 1, mapMark = null, mapCanvas = null, mapDetails = null;
  let livePanel = null;
  const audit = {bindings:[],pending:[],dialogs:[],panels:[]};
  const labels = {inventory:'Hành trang',character:'Nhân vật',skills:'Võ công',quests:'Nhiệm vụ',forge:'Lò rèn',system:'Hệ thống'};
  const el = (selector,ctx=document) => ctx.querySelector(selector);
  const all = (selector,ctx=document) => [...ctx.querySelectorAll(selector)];
  const uiReady = () => !!window.VLI_PC_UI_V24_INTEGRATION && !!el('#vli-pc-v24');
  const api = () => window.VLI_PC_UI_V24_INTEGRATION;
  const gameReady = () => {
    try { return typeof S !== 'undefined' && !!S && !!S.fac; } catch (_) { return false; }
  };
  const game = () => {
    try { return typeof R !== 'undefined' ? R : null; } catch (_) { return null; }
  };
  const char = () => {
    try { return typeof S !== 'undefined' ? S : null; } catch (_) { return null; }
  };
  function toast(message) {
    if (uiReady() && typeof api().toast === 'function') api().toast(message);
    else console.info('[PC V24.2]',message);
  }
  function nativeFunction(name,...args) {
    const f = window[name];
    if (typeof f !== 'function') return {available:false};
    try { return {available:true,value:f(...args)}; }
    catch (e) { toast(name+': '+(e.message||String(e))); return {available:true,error:String(e)}; }
  }
  function action(clickSelector,func,args=[]) {
    if (!gameReady()) { toast('Hãy tạo hoặc chọn nhân vật trước.'); return false; }
    // V6 #bTp binds pointerdown ONLY, so element.click() does not teleport.
    // Delegate to the same existing functions as keyboard T, without touching R directly.
    if(clickSelector==='#bTp') {
      const current=game();
      const result=nativeFunction(current?.town?'backFromTown':'goTown');
      if(!result.available)toast('Chưa có chức năng Thổ Địa Phù trong game.');
      return result.available;
    }
    const b=el(clickSelector);
    if (b) { b.click(); return true; }
    const result=nativeFunction(func,...args);
    if (!result.available) toast('Chức năng chưa có trong phiên bản game này.');
    return result.available;
  }
  function button(className,title,label,fn) {
    const b=document.createElement('button');
    b.type='button';b.className=className;b.title=title;
    b.setAttribute('aria-label',title);b.textContent=label||'';
    b.addEventListener('click',e=>{e.stopPropagation();fn(e);});
    return b;
  }
  function moveSkillSelector() {
    const popup=el('#skPick');
    if (popup && popup.parentElement!==document.body) document.body.appendChild(popup);
    if (popup) popup.classList.add('v242-skill-picker');
  }
  function chooseSlot(index) {
    if (!gameReady()) return toast('Chưa vào game.');
    const r=nativeFunction('pressSlot',index);
    if(!r.available) { toast('Phiên bản game chưa có xử lý ô kỹ năng.'); return; }
    moveSkillSelector();
  }
  function editSlot(index) {
    if (!gameReady()) return toast('Chưa vào game.');
    const r=nativeFunction('skSlotModal',index);
    if(!r.available) toast('Không có bảng chọn kỹ năng.');
    moveSkillSelector();
  }
  function hotbar() {
    const hud=el('#vli-pc-v24 .pc-hud');
    if (!hud) return;
    const group=document.createElement('div');
    group.className='v242-hotkeys';group.setAttribute('aria-label','Bốn ô võ công thật của game');
    for(let i=0;i<4;i++) {
      const b=button('v242-slot','F'+(i+1)+' · chọn võ công', '',()=>chooseSlot(i));
      b.dataset.slot=String(i);
      b.appendChild(Object.assign(document.createElement('span'),{className:'v242-icon'}));
      b.appendChild(Object.assign(document.createElement('small'),{textContent:'F'+(i+1)}));
      b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();editSlot(i);});
      group.append(b);
    }
    hud.append(group);
    const tp=button('v242-utility v242-teleport','Thổ Địa Phù / Trở lại bãi (T)','T',()=>action('#bTp','goTown'));
    hud.append(tp);
    const main=button('v242-utility v242-main','Chiêu chính · bấm mở Võ công','⚔',()=>api().openPanel('skills'));
    main.addEventListener('contextmenu',e=>{e.preventDefault();editSlot(0);});
    hud.append(main);
    const rotate=button('v242-utility v242-rotate','Bật/tắt xoay chiêu (R)','R',()=>action('#rotBtn','toggleRot'));
    hud.append(rotate);
    const potions=all('.hud-potion',hud);
    potions.forEach((b,i)=>{
      b.title=(i===0?'Thuốc sinh lực':'Thuốc nội lực')+' · chuột phải chọn loại';
      b.addEventListener('contextmenu',e=>{
        e.preventDefault();e.stopPropagation();
        if(!gameReady()) return toast('Chưa vào game.');
        const result=nativeFunction('potSlotModal',i);
        if(!result.available)toast('Chưa có menu lựa chọn thuốc.');
      });
    });
    audit.bindings.push('HUD: F1-F4','HUD: chiêu chính','HUD: thuốc 1/2','HUD: chọn thuốc chuột phải','HUD: Thổ Địa Phù','HUD: xoay chiêu');
  }
  function applyHud() {
    if (!gameReady()) return;
    try {
      const s=char(),r=game(),slotList=s.slots||[];
      const sk=typeof SK!=='undefined'?SK:{};
      for(const b of all('#vli-pc-v24 .v242-slot')){
        const i=+b.dataset.slot,id=slotList[i],skill=sk[id],icon=el('.v242-icon',b);
        const isMain=!!(skill&&r?.P?.main?.id===Number(id));
        icon.style.backgroundImage=skill?.ic?'url("'+String(skill.ic).replace(/"/g,'%22')+'")':'';
        b.classList.toggle('v242-current',isMain);
        b.classList.toggle('v242-empty',!skill);
        b.title=skill?'F'+(i+1)+' · '+skill.n+' · cấp '+(s.sk?.[id]||0)+' · chuột phải đổi':'F'+(i+1)+' trống · bấm để chọn';
      }
      const main=el('#vli-pc-v24 .v242-main');
      if(main){
        const current=r?.P?.main;
        main.title='Chiêu chính: '+(current?.n||sk[current?.id]?.n||'Đánh thường')+' · bấm mở Võ công';
        main.style.setProperty('--main-ic',current?.ic?'url("'+current.ic+'")':'none');
      }
      const rot=el('#vli-pc-v24 .v242-rotate');
      if(rot){rot.classList.toggle('v242-current',s.rot!==false);rot.setAttribute('aria-pressed',String(s.rot!==false));}
      const tp=el('#vli-pc-v24 .v242-teleport');
      if(tp){tp.textContent=r?.town?'↩':'T';tp.title=r?.town?'Trở lại bãi luyện (T)':'Thổ Địa Phù về thành (T)';}
      for(const [i,k] of [[0,'life'],[1,'mana']]){
        const btn=el('#vli-pc-v24 .hud-potion[data-game="'+(i===0?'hp':'mp')+'"]');if(!btn)continue;
        const out=typeof slotShow==='function'?slotShow(i):null;
        const image=el('img',btn);if(out?.ic&&image && image.dataset.source!==out.ic){image.src=out.ic;image.dataset.source=out.ic;}
        const cool=Math.max(0,Number(r?.potCd?.[k])||0);
        const max=(typeof POT_CD!=='undefined'?Number(POT_CD):0)||1;
        btn.style.setProperty('--cooldown',String(Math.min(100,100*cool/max))+'%');
        btn.title=(out?.name|| (i===0?'Thuốc sinh lực':'Thuốc nội lực'))+(out?.n?' (còn '+out.n+')':'')+(cool>0?' · hồi '+cool.toFixed(1)+'s':'')+' · nhấn để dùng / chuột phải chọn';
      }
      for(const [id, selector] of [['ride','[data-game="ride"]'],['auto','[data-game="auto"]']]){
        const b=el('#vli-pc-v24 .mini-commands '+selector);
        if(!b)continue;
        if(id==='ride'){
          b.textContent=r?.mounted?'Xuống ngựa (M)':'Lên ngựa (M)';
          b.classList.toggle('v242-active',!!r?.mounted);
          b.setAttribute('aria-pressed',String(!!r?.mounted));
        } else {
          const manual=typeof manualCtrl==='function'?manualCtrl():s.ctrl==='manual';
          b.textContent=manual?'Tự đánh: Tắt (F)':'Tự đánh: Bật (F)';
          b.classList.toggle('v242-active',!manual);
          b.setAttribute('aria-pressed',String(!manual));
        }
      }
    } catch(e) { console.warn('[PC V24.2] HUD update',e); }
  }
  // Never alter item state directly. Details, equip, sell and remove use game's itemModal.
  function viewItem(item, equipped) {
    if(!item)return;
    const result=nativeFunction('itemModal',item,!!equipped);
    if(!result.available)toast('Không có hộp thông tin trang bị trong mã nguồn game.');
  }
  function panelNode(id) { return el('#vli-pc-v24 .pc-window[data-panel="'+id+'"]'); }
  function addHotspot(win, css, name, handler) {
    const b=button('v242-pc-hotspot '+css,name,'',handler);
    b.setAttribute('aria-label',name);win.append(b);return b;
  }
  function drawInventory() {
    const win=panelNode('inventory'),s=char();if(!win||!s?.inv||!gameReady())return;
    let grid=el('.v242-inv-grid',win);
    if(!grid){
      grid=document.createElement('div');grid.className='v242-inv-grid';win.append(grid);
      const nav=document.createElement('div');nav.className='v242-inv-nav';
      const prev=button('','Trang trước','◀',()=>{inventoryPage=Math.max(0,inventoryPage-1);renderVersion='';drawInventory();});
      const label=document.createElement('span');label.className='v242-inv-page';
      const next=button('','Trang sau','▶',()=>{inventoryPage++;renderVersion='';drawInventory();});
      nav.append(prev,label,next);win.append(nav);
      addHotspot(win,'v242-inv-stash','Mở kho chung',()=>{api().closePanel('inventory');api().openPanel('chest');});
      addHotspot(win,'v242-inv-equip','Mở nhân vật / trang bị',()=>api().openPanel('character'));
      addHotspot(win,'v242-inv-close','Đóng hành trang',()=>api().closePanel('inventory'));
      audit.bindings.push('Hành trang PC: ô vật phẩm','Hành trang PC: trang','Hành trang PC: Kho / Nhân vật / Đóng');
    }
    const inv=s.inv,pages=Math.max(1,Math.ceil(inv.length/60));
    if(inventoryPage>=pages)inventoryPage=pages-1;
    const sig=inventoryPage+'|'+inv.map(i=>i?.uid+':'+i?.lvl+':'+i?.enh).join('|');
    if(grid.dataset.sig===sig)return;grid.dataset.sig=sig;grid.replaceChildren();
    for(const item of inv.slice(inventoryPage*60,inventoryPage*60+60)){
      const b=button('v242-inv-item',item.n||'Vật phẩm','',()=>viewItem(item,false));
      if(item.ic){const img=document.createElement('img');img.src=item.ic;img.alt='';b.append(img);}
      if(item.enh){const sub=document.createElement('small');sub.textContent='+'+item.enh;b.append(sub);}
      grid.append(b);
    }
    const nav=el('.v242-inv-nav',win);
    el('.v242-inv-page',nav).textContent=(inventoryPage+1)+'/'+pages+' ('+inv.length+')';
    nav.firstChild.disabled=inventoryPage===0;nav.lastChild.disabled=inventoryPage>=pages-1;
  }
  const slotRegions = [
    {slot:'helm',x:278,y:76,w:54,h:55},{slot:'armor',x:279,y:137,w:54,h:76},
    {slot:'weapon',x:363,y:158,w:53,h:103},{slot:'belt',x:279,y:218,w:54,h:38},
    {slot:'boot',x:363,y:289,w:53,h:55},{slot:'horse',x:279,y:263,w:54,h:81},
    {slot:'cuff',x:216,y:131,w:42,h:45},{slot:'ring1',x:216,y:180,w:42,h:28},
    {slot:'ring2',x:216,y:209,w:42,h:27},{slot:'amulet',x:362,y:77,w:54,h:50},
    {slot:'pendant',x:361,y:127,w:54,h:30}
  ];
  function drawCharacter() {
    const win=panelNode('character'),s=char();if(!win||!gameReady())return;
    let box=el('.v242-equip-grid',win);
    if(!box){
      box=document.createElement('div');box.className='v242-equip-grid';win.append(box);
      addHotspot(win,'v242-char-inv','Mở hành trang',()=>api().openPanel('inventory'));
      addHotspot(win,'v242-char-close','Đóng Nhân vật',()=>api().closePanel('character'));
      audit.bindings.push('Nhân vật PC: 11 ô trang bị / tháo','Nhân vật PC: Hành trang / Đóng');
    }
    const sig=slotRegions.map(x=>s.eq?.[x.slot]?.uid||0).join('|');
    if(box.dataset.sig===sig)return;box.dataset.sig=sig;box.replaceChildren();
    for(const pos of slotRegions){
      const it=s.eq?.[pos.slot];
      const b=button('v242-equip-item'+(it?' v242-equipped':''),
        (pos.slot+(it?' · '+it.n:' · trống')),'',()=>{
          if(it)viewItem(it,true);
          else api().openPanel('inventory');
        });
      b.style.left=pos.x+'px';b.style.top=pos.y+'px';
      b.style.width=pos.w+'px';b.style.height=pos.h+'px';
      if(it?.ic){const img=document.createElement('img');img.src=it.ic;img.alt='';b.append(img);}
      box.append(b);
    }
  }
  function drawSkills() {
    const win=panelNode('skills'),s=char();if(!win||!gameReady())return;
    let wrap=el('.v242-skills-list',win);
    if(!wrap){
      wrap=document.createElement('div');wrap.className='v242-skills-list';win.append(wrap);
      addHotspot(win,'v242-skills-close','Đóng Võ công',()=>api().closePanel('skills'));
      audit.bindings.push('Võ công PC: chọn chiêu chính','Võ công PC: nút Đóng');
    }
    const skills=typeof SK!=='undefined'?SK:{};
    const ids=Object.keys(s.sk||{}).filter(k=>s.sk[k]>0&&skills[k]);
    ids.sort((a,b)=>(skills[b].req||0)-(skills[a].req||0));
    const sig=ids.map(id=>id+':'+s.sk[id]).join('|');
    if(wrap.dataset.sig===sig)return;wrap.dataset.sig=sig;wrap.replaceChildren();
    if(!ids.length){const info=document.createElement('p');info.textContent='Chưa học kỹ năng. Hãy dùng bảng Võ công gốc bên phải.';wrap.append(info);return;}
    for(const id of ids){
      const skill=skills[id];
      const b=button('v242-skill-item',skill.n+' · cấp '+s.sk[id], '',()=>{
        if(typeof isAttack==='function' && !isAttack(skill)) {
          toast('Kỹ năng bị động/hỗ trợ không thể chọn làm chiêu tấn công.');return;
        }
        const res=nativeFunction('selectPrimarySkillV8',Number(id),false);
        if(res.available && res.value===true){selectedSkill=Number(id);toast('Đã chọn chiêu chính: '+skill.n);}
        else if(!res.available)toast('Chọn kỹ năng bằng bảng game bên phải.');
        else if(!res.error)toast('Chưa thể dùng kỹ năng này làm chiêu chính.');
      });
      if(skill.ic){const img=document.createElement('img');img.src=skill.ic;img.alt='';b.append(img);}
      const text=document.createElement('span');text.textContent=skill.n;
      const lv=document.createElement('small');lv.textContent='Lv '+s.sk[id];
      b.append(text,lv);b.dataset.skillId=String(id);wrap.append(b);
    }
  }
  function livePanels() {
    if(!gameReady())return;
    if(panelNode('inventory'))drawInventory();
    if(panelNode('character'))drawCharacter();
    if(panelNode('skills'))drawSkills();
    const r=game();
    if(panelNode('skills'))for(const b of all('.v242-skill-item',panelNode('skills')))b.classList.toggle('v242-current',Number(b.dataset.skillId)===Number(r?.P?.main?.id));
  }
  function openDialogWindow(id){
    const win=panelNode(id);if(!win)return;
    const modal=el('#modal');
    // The game source opens the fully functional modal. Avoid duplicate empty PC skin behind it.
    if(modal && !modal.classList.contains('hidden')){
      queueMicrotask(()=>api().closePanel(id));
      audit.dialogs.push(id);
    } else {
      let msg=el('.pc-not-ready',win);
      if(!msg){msg=document.createElement('div');msg.className='pc-not-ready';win.append(msg);}
      msg.textContent='Giao diện PC có sẵn, nhưng mã game chưa mở được cửa sổ '+id+'.';
    }
  }
  function showTeamStatus(){
    const win=panelNode('team');if(!win)return;
    const p=(typeof PT!=='undefined'?PT:null);
    let box=el('.v242-team-status',win);
    if(!box){box=document.createElement('div');box.className='v242-team-status';win.append(box);}
    box.replaceChildren();
    const title=document.createElement('b');title.textContent='Tổ đội · trạng thái game';box.append(title);
    const text=document.createElement('p');
    text.textContent=p?.off?'Hệ thống Tổ đội đang tạm đóng trong bản game đang sử dụng. Không tự tạo tổ đội giả.':'Hệ thống Tổ đội của game đã bật. Sử dụng bảng chức năng game khi có kết nối.';
    box.append(text);
    if(p?.pid){const id=document.createElement('small');id.textContent='Tổ đội hiện tại: '+p.pid;box.append(id);}
    audit.pending.push('Tổ đội (game gốc tạm đóng)');
  }
  function mapPanel() {
    const win=panelNode('map');if(!win)return;
    const body=el('.generic-body',win);if(!body)return;
    body.replaceChildren();
    const toolbar=document.createElement('div');toolbar.className='v242-map-toolbar';
    const zoomOut=button('native-btn','Thu nhỏ bản đồ','−',()=>{mapZoom=Math.max(1,mapZoom/1.5);});
    const zoomIn=button('native-btn','Phóng to bản đồ','+',()=>{mapZoom=Math.min(4,mapZoom*1.5);});
    const reset=button('native-btn','Trở về tỷ lệ ban đầu','1:1',()=>{mapZoom=1;mapMark=null;});
    toolbar.append(zoomOut,zoomIn,reset);
    mapDetails=document.createElement('div');mapDetails.className='v242-map-details';
    mapCanvas=document.createElement('canvas');mapCanvas.width=382;mapCanvas.height=220;
    mapCanvas.className='v242-map-canvas';mapCanvas.title='Minimap sống · chấm để đánh dấu tạm trên giao diện';
    mapCanvas.addEventListener('click',e=>{
      const r=mapCanvas.getBoundingClientRect();
      mapMark=[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];
    });
    const note=document.createElement('p');note.className='v242-map-note';
    note.textContent='Ảnh bản đồ nhỏ đang chạy trong game, phóng to để quan sát. Đánh dấu chỉ hiển thị trên UI, không di chuyển nhân vật.';
    body.append(toolbar,mapCanvas,mapDetails,note);
    audit.bindings.push('Bản đồ PC: minimap sống / thu phóng / đánh dấu');
    paintMap();
  }
  function paintMap() {
    if(!mapCanvas?.isConnected)return;
    const source=el('#pcv24-minimap .pc-live-mini');
    const ctx=mapCanvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
    ctx.fillStyle='#09150d';ctx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
    if(source && !source.hidden && source.width>0){
      try{
        const sx=source.width/mapZoom,sy=source.height/mapZoom;
        ctx.imageSmoothingEnabled=true;
        ctx.drawImage(source,(source.width-sx)/2,(source.height-sy)/2,sx,sy,0,0,mapCanvas.width,mapCanvas.height);
      }catch(e){console.warn('[PC V24.2] minimap',e);}
    } else {ctx.fillStyle='#dbcb9d';ctx.font='12px Tahoma';ctx.fillText('Chờ bản đồ nhỏ từ game...',20,110);}
    if(mapMark){
      const x=mapMark[0]*mapCanvas.width,y=mapMark[1]*mapCanvas.height;
      ctx.strokeStyle='#f6cf62';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke();
    }
    if(mapDetails){
      let where='';try{if(typeof H!=='undefined'&&H)where=' · Tọa độ '+Math.round(H.x)+', '+Math.round(H.y);}catch(_){ }
      mapDetails.textContent=(el('#pcv24-map-title')?.textContent.trim()||'Bản đồ')+where+' · '+mapZoom.toFixed(1)+'x';
    }
  }
  function tradePreview(){
    const win=panelNode('trade');if(!win)return;
    let container=el('.v242-trade-preview',win);
    if(container)return;
    const old=el('.pc-not-ready',win);if(old)old.remove();
    container=document.createElement('div');container.className='v242-trade-preview';
    const header=document.createElement('div');header.textContent='GIAO DỊCH · Xem vật phẩm (chưa có máy chủ trao đổi)';container.append(header);
    const grid=document.createElement('div');grid.className='v242-trade-grid';
    for(const item of (char()?.inv||[]).slice(0,30)){
      const b=button('v242-trade-item',item.n||'Vật phẩm','',()=>viewItem(item,false));
      if(item.ic){const im=document.createElement('img');im.src=item.ic;im.alt='';b.append(im);}grid.append(b);
    }
    container.append(grid);win.append(container);
    audit.pending.push('Giao dịch (xem vật phẩm, chưa chuyển/nhận)');
  }
  function localChat(){
    const form=el('#pcv24-chatForm');if(!form)return;
    form.addEventListener('submit',e=>{
      const inp=el('#pcv24-chatInput');const value=inp?.value.trim();
      if(!value)return;
      const channel=el('#vli-pc-v24 .chat-channel.active')?.dataset.channel||'Tất cả';
      if(channel!=='Tất cả'){
        e.preventDefault();e.stopImmediatePropagation();
        toast('Kênh '+channel+' chưa nối vào hệ thống chat Võ Lâm Idle.');return;
      }
      const online=typeof CHAT!=='undefined' && !!CHAT?.sb;
      if(online){
        e.preventDefault();e.stopImmediatePropagation();
        const r=nativeFunction('chatSend',value);
        if(r.available)inp.value=''; else toast('Không có bộ gửi tin nhắn game.');
        return;
      }
      e.preventDefault();e.stopImmediatePropagation();
      if(/(?:<|>|\b(?:javascript:|data:)\b)/i.test(value)){
        toast('Không hỗ trợ mã lệnh trong chat cục bộ.');return;
      }
      localNotes.push({id:++localNotesId,msg:value.slice(0,200)});
      localNotes=localNotes.slice(-20);
      inp.value='';syncLocalChat();
    },true);
    const hint=document.createElement('div');hint.className='v242-chat-status';
    hint.textContent='Chat offline: ghi chú cục bộ, không gửi mạng';
    const log=el('#pcv24-chatLog');log?.parentElement?.append(hint);
    audit.bindings.push('Chat: ghi chú cục bộ offline / chat mạng khi cấu hình sẵn');
  }
  function syncLocalChat(){
    const log=el('#pcv24-chatLog');if(!log)return;
    for(const msg of localNotes){
      if(el('[data-v242-note="'+msg.id+'"]',log))continue;
      const row=document.createElement('div');row.className='v242-local-msg';
      row.dataset.v242Note=String(msg.id);
      row.textContent='[Cục bộ] '+msg.msg;log.append(row);
    }
    const hint=el('#vli-pc-v24 .v242-chat-status');
    if(hint){const online=typeof CHAT!=='undefined' && !!CHAT?.sb;
      hint.textContent=online?'Chat mạng: sử dụng chức năng gốc của game':'Chat offline: ghi chú chỉ tồn tại đến khi tải lại trang';}
  }
  function navButtons(){
    const quick=el('#vli-pc-v24 .quick-dock');if(!quick)return;
    // Existing Q and T are gameplay shortcuts (heal/town), not Quest/Team shortcut.
    for(const [panel,key] of [['quests','N'],['team','']]){
      const b=el('[data-open="'+panel+'"]',quick);
      if(b){b.title=panel==='quests'?'Mở cửa sổ Nhiệm vụ bằng nút này (Q dùng thuốc)':'Tổ đội · hệ thống gốc tạm đóng';}
    }
    // Four native controls exposed with clear labels. The original handlers decide validity.
    const buttons=[
      {id:'town',label:'Thổ Địa Phù',title:'Về thành / trở lại bãi (T)',run:()=>action('#bTp','goTown')},
      {id:'rotate',label:'Xoay chiêu',title:'Xoay chiêu tự động (R)',run:()=>action('#rotBtn','toggleRot')},
      {id:'help',label:'?',title:'Xem hướng dẫn điều khiển',run:()=>api().openPanel('help')}
    ];
    for(const cfg of buttons){
      const b=button('v242-dock-extra',cfg.title,cfg.label,cfg.run);
      b.dataset.extra=cfg.id;quick.append(b);
    }
    const more=button('v242-dock-extra v242-more-trigger','Mở các cửa sổ PC còn lại','Thêm ▾',()=>{
      const menu=el('#vli-pc-v24 .v242-more-menu');
      if(menu){menu.remove();return;}
      const panel=document.createElement('div');panel.className='v242-more-menu';
      const items=[['forge','Lò rèn'],['map','Bản đồ'],['friends','Hảo hữu'],
        ['messages','Tin nhắn'],['help','Điều khiển']];
      for(const [id,name] of items){
        const b=button('native-btn','Mở '+name,name,()=>{panel.remove();api().openPanel(id);});
        panel.append(b);
      }
      el('#vli-pc-v24 .pc-desktop')?.append(panel);
    });
    quick.append(more);
    document.addEventListener('pointerdown',e=>{
      const menu=el('#vli-pc-v24 .v242-more-menu');
      if(menu&&!menu.contains(e.target)&&!e.target.closest('.v242-more-trigger'))menu.remove();
    },true);
    audit.bindings.push('Quick dock: TP / Xoay / Trợ giúp / menu 5 cửa sổ');
  }
  function nativeModalTheme(){
    const modal=el('#modal');
    if(modal)modal.classList.add('v242-native-modal');
  }
  function onPanel({id}){
    audit.panels.push(id);
    if(id==='inventory')drawInventory();
    if(id==='character')drawCharacter();
    if(id==='skills')drawSkills();
    if(id==='map')mapPanel();
    if(id==='team')showTeamStatus();
    if(id==='trade')tradePreview();
    if(id==='shop'||id==='chest')openDialogWindow(id);
    if(id==='guild'||id==='friends'||id==='messages')audit.pending.push(id);
  }
  function status(){
    return {version:VERSION,ready,state,error:err,gameReady:gameReady(),
      livePanels:Object.keys(labels),pcSlots:el('#vli-pc-v24 .v242-hotkeys')?.children.length||0,
      inventoryCells:el('#vli-pc-v24 .v242-inv-item')?all('.v242-inv-item',panelNode('inventory')).length:0,
      equipmentCells:all('#vli-pc-v24 .v242-equip-item').length,
      mappedControls:[...new Set(audit.bindings)],
      deferred:[...new Set(audit.pending)],nativeDialogsOpened:[...new Set(audit.dialogs)],
      saveOrCombatPatched:false};
  }
  const publicApi={version:VERSION,status,openMap:()=>api()?.openPanel('map'),
    openPanel:(id)=>api()?.openPanel(id),
    refresh:()=>{applyHud();livePanels();paintMap();syncLocalChat();},
    audit:()=>({mapped:[...new Set(audit.bindings)],pending:[...new Set(audit.pending)]})};
  window.VLI_PC_UI_V24_CONTROLS=publicApi;

  function init(){
    if(!uiReady()){
      state='error';err='V24.1 shell/bridge not installed (install V24.1 first)';
      console.error('[PC V24.2]',err);return;
    }
    try{
      hotbar();navButtons();localChat();nativeModalTheme();
      api().on('panel.open',onPanel);
      state='ready';ready=true;
      setInterval(()=>{if(!el('#vli-pc-v24'))return;applyHud();livePanels();paintMap();syncLocalChat();},500);
      applyHud();
      console.info('[VLI PC V24.2] Controls connected',status());
    }catch(e){state='error';err=String(e);console.error('[PC V24.2]',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
