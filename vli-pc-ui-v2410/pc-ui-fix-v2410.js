/* Võ Lâm Idle H5 V24.10 — PC UI cleanup, original game bag/stable/effects, local offline chat. */
(() => {
  'use strict';
  if (window.VLI_PC_UI_V2410) return;
  const VERSION = '24.10.0';
  const $ = (q,ctx=document) => ctx.querySelector(q);
  const $$ = (q,ctx=document) => [...ctx.querySelectorAll(q)];
  const root = () => $('#vli-pc-v24 .pc-desktop');
  const panel = id => $(`#vli-pc-v24 .pc-window[data-panel="${id}"]`);
  const hero = () => { try { return typeof S !== 'undefined' ? S : null; } catch (_) { return null; } };
  const game = () => { try { return typeof R !== 'undefined' ? R : null; } catch (_) { return null; } };
  const pc = () => window.VLI_PC_UI_V24_INTEGRATION;
  const toast = text => pc()?.toast?.(String(text)) ?? console.info('[PC V24.10]',text);
  const el = (tag,cls,text) => { const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n; };
  const button = (text,cls,fn) => {const b=el('button',cls,text);b.type='button';b.addEventListener('click',e=>{e.stopPropagation();fn(e);});return b;};
  const active = () => !!root() && !!pc();
  const CHANNELS = ['Tất cả','Mật','Tên','Bang hội','Môn phái','Khác'];
  const FILTERS = [ ['all','Tất cả'],['gold','Hoàng Kim'],['platina','Bạch Kim'],['lock','Đã khóa'] ];
  const SORTS = ['new','rar','lvl','slot','pow'];
  const emojiRe = /:pc(\d{2}):/g;
  let ready=false,lastError=null, inventoryUpdates=0, sellActions=0, bagSorts=0, horseOpens=0, effectRefreshes=0;
  let channel='Tất cả', filter='all', filterOpen=false;
  let chatMessages=[],chatUser='',chatSig='',lastInvSig='',lastGearSig='',lastEffectSig='',lastGoldInfo=null;
  let shortMenu=false,lastInventoryRefresh=0, lastChatRender=0;
  function native(name,...args){
    const fn=window[name];
    if(typeof fn!=='function') {toast('Chưa có chức năng trong game: '+name);return {ok:false};}
    try {return {ok:true,value:fn(...args)};}
    catch(e){lastError=String(e);console.warn('[PC V24.10] '+name,e);toast('Không thực hiện được thao tác này');return {ok:false};}
  }
  function safeSave(){ if(typeof window.save==='function') {try {window.save();}catch(e){lastError=String(e);} } }
  function refreshNative(){
    try {
      if(typeof window.refresh==='function')window.refresh();
      if(game())game().dirty=true;
    }catch(e){lastError=String(e);console.warn('[PC V24.10] Refresh',e);}
    window.VLI_PC_UI_V249?.refresh?.();
  }
  function fmt(n){return Math.floor(Number(n)||0).toLocaleString('vi-VN');}
  function silverText(value){
    const n=Math.max(0,Math.floor(Number(value)||0));
    return `${fmt(Math.floor(n/10000))} vạn ${fmt(n%10000)} lượng`;
  }
  function hideExtraUI(){
    const d=root(); if(!d)return;
    if(!$('.pc250-menu-toggle',d)){
      const btn=button('Chức năng ≡','pc250-menu-toggle',()=>{
        shortMenu=!shortMenu;d.classList.toggle('pc250-menu-open',shortMenu);btn.setAttribute('aria-expanded',String(shortMenu));
      });
      btn.setAttribute('aria-expanded','false');btn.title='Mở các chức năng PC chưa có nút trên thanh dưới';
      d.append(btn);
    }
    d.classList.add('pc250-ui');
  }
  function prepareCharacter(){
    const w=panel('character');if(!w)return;
    w.classList.add('pc250-character');
    if(!$('.pc250-title',w))w.append(el('div','pc250-title','TRANG BỊ VÀ THUỘC TÍNH'));
    if(!$('.pc250-gear-shade',w))w.insertBefore(el('div','pc250-gear-shade'),$('.v242-equip-grid',w));
    if(!$('.pc250-effects-control',w)){
      const btn=button('Khôi phục hiệu ứng Hoàng Kim','pc250-effects-control',enableEffects);
      btn.title='Bật hiển thị hiệu ứng trang bị, tắt chế độ giảm hiệu ứng và đồng bộ lại hiệu ứng nhân vật';
      w.append(btn);
    }
    const sig=gearSignature();
    if(sig!==lastGearSig){lastGearSig=sig;repairLook(false);}
  }
  function gearSignature(){
    const s=hero();if(!s)return '';
    return Object.entries(s.eq||{}).map(([k,v])=>`${k}:${v?.uid||0}:${v?.enh||0}:${v?.set?.kind||''}`).join('|');
  }
  function repairLook(force){
    const r=game(),s=hero();if(!r||!s||typeof window.heroLook!=='function')return false;
    try {
      if(force){s.lookFx=true;s.lowFx=false;}
      const result=window.heroLook();
      lastGoldInfo={hasAura:!!result?.aura,hasWeaponGlow:!!result?.glow,lowFx:!!s.lowFx,lookFx:s.lookFx!==false,
        equippedSets:Object.values(s.eq||{}).filter(x=>x?.set?.kind==='gold'||x?.set?.kind==='platina').length};
      if(force||!r.look||r.look.key!==result.key){r.look=result;effectRefreshes++;r.dirty=true;}
      if(force){
        if(typeof window.recalc==='function')window.recalc();
        if(typeof window.jxPreload==='function')window.jxPreload();
        safeSave();toast(result?.aura||result?.glow?'Đã làm mới hiệu ứng trang bị':'Đã bật hiệu ứng. Một số bộ cần đủ món/đúng điều kiện để phát sáng.');
      }
      return true;
    }catch(e){lastError=String(e);return false;}
  }
  function enableEffects(){repairLook(true);}
  function openHorse(){
    if(!hero())return;
    horseOpens++;
    const api=pc();api?.closePanel?.('character');
    if(typeof window.actModal==='function')return native('actModal','horse');
    if(typeof window.horsePickModal==='function')return native('horsePickModal');
    toast('Phiên bản game này chưa nạp được Mã Trường.');
  }
  function interceptHorse(e){
    const b=e.target.closest?.('#vli-pc-v24 .v242-equip-item');
    if(!b)return;
    const title=b.title||'';
    if(!/^horse(?:\s|·|$)/i.test(title) && !(b.style.left==='279px'&&b.style.top==='263px'))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openHorse();
  }
  function applyFilter(item){
    if(filter==='gold')return item?.set?.kind==='gold';
    if(filter==='platina')return item?.set?.kind==='platina';
    if(filter==='lock')return !!item?.lock;
    return true;
  }
  function sortInventory(){
    const w=panel('inventory'),s=hero(),grid=w&&$('.v242-inv-grid',w);
    if(!grid||!s?.inv)return;
    const items=s.inv;
    const real=$$('button.v242-inv-item',grid);
    const sig=grid.dataset.sig||'';
    const mode=s.invSort||'new';
    const orderKey=sig+'|'+mode+'|'+filter;
    if(orderKey===lastInvSig && grid.dataset.pc250Ordered===orderKey)return;
    if(grid.dataset.pc250Source!==sig){
      real.forEach((b,i)=>b.dataset.pc250Uid=String(items[i]?.uid??('i'+i)));
      grid.dataset.pc250Source=sig;
    }
    const dict=new Map(real.map((b,i)=>[b.dataset.pc250Uid,{button:b,item:items.find(it=>String(it?.uid)===b.dataset.pc250Uid)||items[i],index:i}]));
    const rows=[...dict.values()];
    if(mode==='rar')rows.sort((a,b)=>(b.item?.r||0)-(a.item?.r||0)||(b.item?.lvl||0)-(a.item?.lvl||0));
    else if(mode==='lvl')rows.sort((a,b)=>(b.item?.lvl||0)-(a.item?.lvl||0)||(b.item?.r||0)-(a.item?.r||0));
    else if(mode==='pow'&&typeof itemPower==='function')rows.sort((a,b)=>itemPower(b.item)-itemPower(a.item));
    else if(mode==='slot')rows.sort((a,b)=>(a.item?.d??99)-(b.item?.d??99));
    else rows.sort((a,b)=>a.index-b.index);
    const blanks=$$('.pc249-inv-empty,.pc250-inv-empty',grid);
    for(const row of rows){row.button.classList.toggle('pc250-filtered',!applyFilter(row.item));grid.append(row.button);}
    for(const blank of blanks)grid.append(blank);
    grid.dataset.pc250Ordered=orderKey;
    lastInvSig=orderKey;inventoryUpdates++;
  }
  function nextBagSort(){
    const s=hero();if(!s)return;
    const current=SORTS.indexOf(s.invSort||'new');
    s.invSort=SORTS[(current+1)%SORTS.length];bagSorts++;
    lastInvSig='';safeSave();sortInventory();updateInventoryFooter();
    toast('Sắp xếp túi: '+({new:'Mới nhất',rar:'Độ quý',lvl:'Cấp đồ',slot:'Loại trang bị',pow:'Sức mạnh'}[s.invSort]||s.invSort));
  }
  function safeSellCandidates(){
    const s=hero();if(!s?.inv||typeof lootMatch!=='function'||typeof sellProtected!=='function')return null;
    try{return s.inv.filter(it=>!lootMatch(it)&&!sellProtected(it));}
    catch(e){lastError=String(e);return null;}
  }
  function sellFast(){
    const candidates=safeSellCandidates();if(!candidates)return toast('Bộ lọc bán nhanh chưa sẵn sàng.');
    if(!candidates.length)return toast('Không có món nào đủ điều kiện bán.');
    // sellUnmatched respects the game's filter, but depending on player settings
    // unprotected rare/set pieces could be included. Refuse batch selling those.
    const risky=candidates.filter(it=>it?.set||it?.vio||it?.plv||it?.thanma||Number(it?.r)>=3);
    if(risky.length){
      toast('Đã chặn bán nhanh: có '+risky.length+' món hiếm/Hoàng Kim chưa được bộ lọc bảo vệ. Hãy khóa hoặc chỉnh bộ lọc trước.');
      return;
    }
    const before=(hero()?.gold||0);
    const estimate=typeof itemValue==='function'?candidates.reduce((n,x)=>n+itemValue(x),0):null;
    if(!window.confirm(`BÁN NHANH ${candidates.length} MÓN KHÔNG KHỚP BỘ LỌC?\n\n`+
        (estimate!==null?`Dự kiến nhận: ${silverText(estimate)}\n`:'')+
        'Ngựa, đồ đã khóa, Hoàng Kim/Bạch Kim được bảo vệ sẽ không bị bán theo quy tắc gốc.\nKHÔNG THỂ HOÀN TÁC sau khi xác nhận.'))return;
    const result=native('sellUnmatched');
    if(result.ok){sellActions++;safeSave();refreshNative();lastInvSig='';
      toast(`Đã bán ${result.value?.n??candidates.length} món · nhận ${silverText(result.value?.gold??(hero().gold-before))}`);}
  }
  function toggleFilter(){filterOpen=!filterOpen;const w=panel('inventory');w?.classList.toggle('pc250-filter-open',filterOpen);}
  function gameFilter(){
    if(typeof window.u20Tt==='function')return native('u20Tt','loot');
    toast('Bộ lọc nhặt nâng cao chưa có trong phiên bản này.');
  }
  function invButton(text,action){return button(text,'pc250-inv-action',action);}
  function initInventory(){
    const w=panel('inventory');if(!w)return;
    w.classList.add('pc250-inventory');
    if(!$('.pc250-inventory-footer',w)){
      const foot=el('section','pc250-inventory-footer');
      const money=el('div','pc250-money');money.append(el('span','pc250-silver'),el('span','pc250-knb'));foot.append(money);
      const top=el('div','pc250-inventory-actions');
      top.append(invButton('Dọn túi',nextBagSort),invButton('Bán nhanh',sellFast),invButton('Lọc trang bị',toggleFilter));
      foot.append(top);
      const filterbar=el('div','pc250-filterbar');
      for(const [key,label] of FILTERS){const b=invButton(label,()=>{filter=key;lastInvSig='';sortInventory();updateInventoryFooter();});b.dataset.filter=key;filterbar.append(b);}
      filterbar.append(invButton('Lọc nhặt…',gameFilter));foot.append(filterbar);
      const bottom=el('div','pc250-inventory-actions pc250-inventory-bottom');
      bottom.append(invButton('Kho',()=>pc()?.openPanel?.('chest')),
        invButton('Nhân vật',()=>pc()?.openPanel?.('character')),
        invButton('Đóng',()=>pc()?.closePanel?.('inventory')));
      foot.append(bottom);w.append(foot);
    }
    updateInventoryFooter();sortInventory();
  }
  function updateInventoryFooter(){
    const w=panel('inventory'),s=hero();if(!w||!s)return;
    const silver=$('.pc250-silver',w),knb=$('.pc250-knb',w);
    if(silver)silver.textContent='Ngân lượng: '+silverText(s.gold);
    if(knb)knb.textContent='Kim Nguyên Bảo: '+fmt(s.knb);
    for(const b of $$('.pc250-filterbar [data-filter]',w))b.classList.toggle('active',b.dataset.filter===filter);
    const sell=$$('.pc250-inventory-actions button',w).find(b=>b.textContent==='Bán nhanh');
    const candidates=safeSellCandidates();
    if(sell){sell.disabled=!candidates?.length;sell.title=candidates?`Bán ${candidates.length} món không khớp lọc, có xác nhận`: 'Chưa nạp bộ lọc game';}
  }
  function chatStorageKey(){return 'vli_pc_chat_local_v2410_'+String(hero()?.name||'nhanvat').replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,32);}
  function loadChat(){
    const who=chatStorageKey();if(who===chatUser)return;chatUser=who;
    try{const arr=JSON.parse(localStorage.getItem(who)||'[]');chatMessages=Array.isArray(arr)?arr.filter(x=>x&&CHANNELS.includes(x.channel)).slice(-100):[];}
    catch(_){chatMessages=[];}
    chatSig='';
  }
  function persistChat(){try{localStorage.setItem(chatUser,JSON.stringify(chatMessages.slice(-100)));}catch(e){console.info('[PC V24.10] Local chat history not persistent:',e);}}
  function mkEmoji(container,text){
    const str=String(text||'');let last=0;emojiRe.lastIndex=0;
    for(const match of str.matchAll(emojiRe)){
      const idx=Number(match[1]);if(idx<1||idx>72)continue;
      container.append(document.createTextNode(str.slice(last,match.index)));
      const sprite=el('span','pc250-emote-inline');
      const j=idx-1;
      sprite.style.backgroundPosition=`-${(j%9)*25}px -${Math.floor(j/9)*25}px`;
      sprite.title='Biểu tượng PC '+idx;container.append(sprite);last=match.index+match[0].length;
    }
    container.append(document.createTextNode(str.slice(last)));
  }
  function collectChat(){
    const s=hero(),r=game(),logs=Array.isArray(r?.logs)?r.logs.slice(0,36).reverse():[];
    const nativeRows=logs.map((raw,index)=>{
      const span=el('span');span.innerHTML=String(raw||'');const value=span.textContent||'';
      const chan=/bang hội|bang phái|\[bang\]/i.test(value)?'Bang hội':/môn phái|\[môn\]/i.test(value)?'Môn phái':/mật|riêng|pm\s/i.test(value)?'Mật':/hệ thống|nhặt|bán|quái|nhận|về thành|lên cấp/i.test(value)?'Khác':'Tất cả';
      return {channel:chan,text:value,ts:index,kind:'native'};
    });
    const localRows=chatMessages.map((x,index)=>({channel:x.channel,text:x.text,ts:x.ts||Date.now(),kind:'local',name:x.name||s?.name||'Nhân vật'}));
    return {nativeRows,localRows};
  }
  function showRow(box,row){
    const line=el('div','pc250-chat-row '+(row.kind==='local'?'pc250-chat-local':'pc250-chat-system'));
    const prefix=el('strong','pc250-chan-name',row.kind==='local'?`[${row.channel}] ${row.name}: `:'[Game] ');
    line.append(prefix);mkEmoji(line,row.text);
    if(row.kind==='local'&&row.channel!=='Tất cả')line.append(el('small','pc250-offline-tag',' (chỉ lưu ngoại tuyến)'));
    box.append(line);
  }
  function renderChat(force=false){
    const chat=$('#pcv24-chat'),log=$('#pc250-chat-lines');if(!chat||!log)return;
    loadChat();const {nativeRows,localRows}=collectChat();
    const signature=[channel,localRows.length,localRows.at(-1)?.text||'',nativeRows.length,nativeRows.at(-1)?.text||'',nativeRows[0]?.text||''].join('|');
    if(!force&&signature===chatSig)return;chatSig=signature;
    log.replaceChildren();
    let visible;
    if(channel==='Tất cả')visible=[...nativeRows.slice(-25),...localRows.slice(-25)];
    else if(channel==='Khác')visible=[...nativeRows.filter(x=>x.channel==='Khác').slice(-25),...localRows.filter(x=>x.channel==='Khác')];
    else if(channel==='Tên')visible=[...nativeRows.filter(x=>hero()?.name&&x.text.includes(hero().name)).slice(-25),...localRows.filter(x=>x.channel==='Tên')];
    else visible=[...nativeRows.filter(x=>x.channel===channel).slice(-25),...localRows.filter(x=>x.channel===channel)];
    for(const row of visible.slice(-40))showRow(log,row);
    if(!visible.length)log.append(el('div','pc250-empty-chat','Chưa có tin ở kênh này. Chat offline chỉ hiển thị trên máy của bạn.'));
    log.scrollTop=log.scrollHeight;
  }
  function sendChat(e){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const input=$('#pcv24-chatInput');if(!input)return;
    const text=input.value.trim().slice(0,200);if(!text)return;
    if(/^\s*[\/=]|\b(?:document|window|eval|localStorage)\b/i.test(text))return toast('Không gửi lệnh mã qua chat.');
    const s=hero();if(!s)return toast('Hãy chọn nhân vật để chat.');
    // Native CHAT can send only if the optional online backend is actually connected and authenticated.
    const online=typeof CHAT!=='undefined'&&!!CHAT?.sb&&CHAT.state==='ok'&&channel==='Tất cả';
    if(online&&typeof window.chatSend==='function'){
      const nativeInput=$('#chatTxt');if(nativeInput)nativeInput.value=text;
      try{window.chatSend(text);input.value='';toast('Đang gửi tin thế giới qua máy chủ chat.');return;}
      catch(err){lastError=String(err);}
    }
    chatMessages.push({channel,text,name:s.name||'Nhân vật',ts:Date.now()});
    chatMessages=chatMessages.slice(-100);persistChat();input.value='';chatSig='';renderChat(true);
  }
  function pickChannel(e){
    const b=e.target.closest?.('#vli-pc-v24 .chat-channel');if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    channel=CHANNELS.includes(b.dataset.channel)?b.dataset.channel:'Tất cả';
    $$('#pcv24-chat .chat-channel').forEach(x=>x.classList.toggle('active',x.dataset.channel===channel));
    const input=$('#pcv24-chatInput');if(input)input.placeholder=channel==='Tất cả'?'Nhập chat thế giới (offline lưu cục bộ)':channel==='Mật'?'Mật: @Tên nhân vật nội dung (lưu cục bộ)':`Kênh ${channel} · chỉ lưu trên máy này`;
    chatSig='';renderChat(true);
  }
  function prepareChat(){
    const chat=$('#pcv24-chat'),form=$('#pcv24-chatForm');if(!chat||!form)return;
    chat.classList.add('pc250-chat');
    if(!$('#pc250-chat-lines',chat)){
      const log=el('div','pc250-chat-lines');log.id='pc250-chat-lines';
      const old=$('#pcv24-chatLog',chat);if(old)old.insertAdjacentElement('afterend',log);else chat.prepend(log);
    }
    if(!form.dataset.pc250Capture){form.addEventListener('submit',sendChat,true);form.dataset.pc250Capture='1';}
    const channels=$('.chat-channels',chat);
    if(channels&&!channels.dataset.pc250Capture){channels.addEventListener('click',pickChannel,true);channels.dataset.pc250Capture='1';}
    loadChat();renderChat();
  }
  function onEscape(e){
    if(e.key!=='Escape')return;
    const d=root();if(d?.classList.contains('pc250-menu-open')){
      shortMenu=false;d.classList.remove('pc250-menu-open');$('.pc250-menu-toggle',d)?.setAttribute('aria-expanded','false');
    }
  }
  function refresh(){
    if(!active())return;
    hideExtraUI();prepareCharacter();initInventory();prepareChat();
    const s=hero();if(s&&game()&&typeof window.heroLook==='function'){
      const sig=gearSignature()+'|'+String(s.lookFx)+'|'+String(s.lowFx);
      if(sig!==lastEffectSig){lastEffectSig=sig;repairLook(false);}
    }
  }
  function status(){
    const s=hero(),r=game();return {version:VERSION,ready,pcUI:active(),quickDockCollapsed:!shortMenu,
      inventoryMoneyVisible:!!$('.pc250-money'),silver:s?.gold||0,knb:s?.knb||0,
      inventorySort:s?.invSort||'new',inventoryFilter:filter,inventoryUpdates,bagSorts,sellActions,
      stableOpens:horseOpens,channel,chatChannels:CHANNELS,localChatMessages:chatMessages.length,
      goldFx:lastGoldInfo,effectRefreshes,effectsEnabled:s?.lookFx!==false&&!s?.lowFx,
      gameLookPresent:!!r?.look,lastError,
      note:'Offline chat channels are local to this device. Real remote messages need configured server. Gold glow still subject to set/equipment activation rules.'};
  }
  const api=window.VLI_PC_UI_V2410={version:VERSION,status,refresh,openStable:openHorse,restoreEquipmentEffects:enableEffects,filterInventory:key=>{filter=FILTERS.some(x=>x[0]===key)?key:'all';lastInvSig='';refresh();}};
  function init(){
    if(!active()){lastError='Cần cài V24.3/V24.9 giao diện PC trước V24.10';console.warn('[PC UI V24.10]',lastError);return;}
    root().addEventListener('click',interceptHorse,true);
    document.addEventListener('keydown',onEscape,true);
    const hook=pc();hook?.on?.('panel.open',()=>setTimeout(refresh,40));
    refresh();setInterval(refresh,650);ready=true;
    console.info('[Võ Lâm H5 PC UI V24.10] Ready',status());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
