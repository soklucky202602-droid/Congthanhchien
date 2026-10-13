/* Võ Lâm Idle Offline — V24.8 PC Client visual controls.
 * Uses real V6 gameplay/data; reference texture assets are supplied PC screenshots.
 * Does not rewrite combat, save, item prices, or the Kỳ Trân Các purchase rules.
 */
(() => {
  'use strict';
  if (window.VLI_PC_UI_V248) return;
  const VERSION = '24.8.0';
  const ROOT = 'vli-pc-ui-v248/assets/';
  const tabs = [
    {key:'premium',title:'Cực phẩm',ids:['tt','qht','rngua','vlmt','ttk','dtbk','knb']},
    {key:'misc',title:'Tạp hóa',ids:['knb','tt','qht','ldt','ldp','dgt','rngua']},
    {key:'outfits',title:'Ngoại trang',ids:[]},
    {key:'mineral',title:'Khoáng thạch',ids:['rht','rda']},
    {key:'books',title:'Bí kíp',ids:['mt90','vlmt','ttk','dtbk']}
  ];
  const symbols={character:'♟',inventory:'▣',skills:'✦',quests:'▤',team:'♧',guild:'♜',trade:'⇄',chest:'▥',shop:'◈',system:'⚙',forge:'⚒',map:'▣',friends:'♧',messages:'✉',help:'?',town:'♧',rotate:'✧'};
  let initDone=false, ktc=null, emotes=null, page=0, category='premium', dialogOpen=0;
  let chatRendered=0, lastError=null, observers=null;
  let purchases=0, catalogCount=0, nativeShopDelegated=false;
  const $=(selector,ctx=document)=>ctx.querySelector(selector);
  const $$=(selector,ctx=document)=>[...ctx.querySelectorAll(selector)];
  const activeUI=()=>!!window.VLI_PC_UI_V24_INTEGRATION && !!$('#vli-pc-v24 .pc-desktop');
  const desktop=()=>$('#vli-pc-v24 .pc-desktop');
  function message(text){
    if(typeof window.VLI_PC_UI_V24_INTEGRATION?.toast==='function')window.VLI_PC_UI_V24_INTEGRATION.toast(text);
    else console.info('[V24.8]',text);
  }
  function node(tag,cls,text){const element=document.createElement(tag);if(cls)element.className=cls;if(text!=null)element.textContent=text;return element;}
  function pcButton(label,cls,handler){const b=node('button',cls,label);b.type='button';if(handler)b.addEventListener('click',handler);return b;}
  function gameReady(){try{return typeof S!=='undefined'&&S&&S.fac;}catch(_){return false;}}
  function items(){try{return typeof KTC!=='undefined'&&Array.isArray(KTC)?KTC:[];}catch(_){return [];}}
  function money(){try{return {knb:Number(S?.knb)||0,gold:Number(S?.gold)||0};}catch(_){return {knb:0,gold:0};}}
  function pcFormat(value){const num=Number(value)||0;return num.toLocaleString('vi-VN');}
  function canBuy(item){try{return typeof ktcOk==='function'&&typeof ktcCan==='function'&&ktcOk(item)&&ktcCan(item);}catch(_){return false;}}
  function getItem(id){return items().find(item=>item.k===id)||null;}
  function goods(){
    const ids=tabs.find(t=>t.key===category)?.ids||[];
    return ids.map(getItem).filter(Boolean);
  }
  function windowMove(win,handle){
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('button'))return;
      e.preventDefault();const x=e.clientX,y=e.clientY;const left=win.offsetLeft,top=win.offsetTop;
      handle.setPointerCapture(e.pointerId);
      const move=v=>{const d=desktop();win.style.left=Math.max(0,Math.min(d.clientWidth-win.offsetWidth,left+v.clientX-x))+'px';
        win.style.top=Math.max(0,Math.min(d.clientHeight-win.offsetHeight,top+v.clientY-y))+'px';};
      const finish=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
    });
  }
  function makeStore(){
    if(ktc){ktc.hidden=false;renderStore();return ktc;}
    const d=desktop();if(!d)return null;
    ktc=node('section','pc248-ktc');ktc.id='pc248-ktc';ktc.setAttribute('aria-label','Kỳ Trân Các giao diện PC');
    const head=node('div','pc248-shop-head');
    head.append(node('h2',null,'KỲ TRÂN CÁC'));
    const close=pcButton('×','pc248-close',closeStore);close.title='Đóng Kỳ Trân Các';head.append(close);
    ktc.append(head);
    const nav=node('div','pc248-shop-tabs');
    for(const tab of tabs){const b=pcButton(tab.title,'pc248-shop-tab',()=>{category=tab.key;page=0;renderStore();});b.dataset.category=tab.key;nav.append(b);}
    ktc.append(nav);
    const paging=node('div','pc248-shop-pagebar');
    paging.append(pcButton('Trước','pc248-page-prev',()=>{page=Math.max(0,page-1);renderStore();}));
    const bank=node('span','pc248-shop-bank');bank.id='pc248-shop-bank';paging.append(bank);
    paging.append(pcButton('Kế','pc248-page-next',()=>{page++;renderStore();}));
    ktc.append(paging);
    const grid=node('div','pc248-shop-cards');grid.id='pc248-shop-cards';ktc.append(grid);
    const footer=node('div','pc248-shop-bottom');
    const explanation=node('span','pc248-shop-hint','Giá và vật phẩm sử dụng dữ liệu Võ Lâm Idle hiện tại');footer.append(explanation);
    footer.append(pcButton('ĐÓNG','pc248-bottom-close',closeStore));ktc.append(footer);
    d.append(ktc);
    const sw=Math.min(575,d.clientWidth-8),sh=Math.min(508,d.clientHeight-20);
    ktc.style.left=Math.max(4,(d.clientWidth-sw)/2)+'px';ktc.style.top=Math.max(10,(d.clientHeight-sh)/2)+'px';
    windowMove(ktc,head);
    renderStore();return ktc;
  }
  function closeStore(){if(ktc)ktc.hidden=true;}
  function renderStore(){
    if(!ktc||ktc.hidden)return;
    const list=goods();catalogCount=items().length;
    const pages=Math.max(1,Math.ceil(list.length/15));page=Math.max(0,Math.min(pages-1,page));
    for(const button of $$('.pc248-shop-tab',ktc))button.classList.toggle('active',button.dataset.category===category);
    const bal=money();const bank=$('#pc248-shop-bank',ktc);
    if(bank)bank.textContent='Kim Nguyên Bảo: '+pcFormat(bal.knb)+' · Ngân lượng: '+pcFormat(bal.gold);
    const prev=$('.pc248-page-prev',ktc),next=$('.pc248-page-next',ktc);
    prev.disabled=page<=0;next.disabled=page>=pages-1;
    const grid=$('#pc248-shop-cards',ktc);
    const sig=[category,page,bal.knb,bal.gold,...list.map(it=>it.k+':'+(canBuy(it)?'1':'0'))].join('|');
    if(grid.dataset.sig===sig)return;
    grid.dataset.sig=sig;grid.replaceChildren();
    for(let i=0;i<15;i++){
      const it=list[page*15+i],slot=node('article','pc248-shop-card');
      if(it){
        const img=node('img','pc248-shop-icon');img.src=it.ic;img.alt='';img.loading='lazy';slot.append(img);
        const name=node('span','pc248-shop-name',it.n);name.title=it.n;slot.append(name);
        slot.append(node('span','pc248-price-label','Giá gốc:'));
        slot.append(node('span','pc248-shop-price',pcFormat(it.knb||it.gold)+' '+(it.knb?'KNB':'lượng')));
        slot.append(node('span','pc248-price-label pc248-price-actual','Giá thực:'));
        const actual=node('span','pc248-shop-price pc248-shop-price-actual',pcFormat(it.knb||it.gold)+' '+(it.knb?'KNB':'lượng'));slot.append(actual);
        const buy=pcButton('Mua','pc248-buy',()=>buyItem(it));buy.disabled=!gameReady()||!canBuy(it);buy.title=it.d||it.n;slot.append(buy);
      }else{slot.classList.add('empty');}
      grid.append(slot);
    }
    // A shop category with no native items stays visibly empty; we do not invent real stock.
  }
  function buyItem(item){
    if(!gameReady())return message('Chưa vào nhân vật.');
    if(!canBuy(item))return message('Không đủ tiền hoặc chưa đáp ứng điều kiện mua.');
    if(typeof ktcBuy!=='function')return message('Chưa tìm thấy chức năng mua của Võ Lâm Idle.');
    try{const n=ktcBuy(item.k,1,true);if(n){purchases+=n;message('Đã mua: '+item.n);}renderStore();}
    catch(e){lastError=String(e);console.warn('[V24.8] Kỳ Trân Các',e);message('Không mua được vật phẩm này.');}
  }

  function wrapOriginalKtc(){
    const fn=window.ktcModal;
    if(typeof fn!=='function'||fn.__v248Ktc)return;
    const wrapper=function(...args){
      if(activeUI()&&document.body.classList.contains('vli-pc-ui-v24')&&
         $('#vli-pc-v24')?.style.display!=='none'){
        if(!gameReady())return message('Hãy chọn nhân vật trước.');
        return makeStore();
      }
      return fn.apply(this,args);
    };
    wrapper.__v248Ktc=true;
    window.ktcModal=wrapper;
    nativeShopDelegated=true;
  }
  function shopEvents(e){
    // Capture the one-button legacy action before V24 bridge opens the old wide HTML modal.
    const target=e.target.closest('[data-game="ktc"]');
    if(!target||!target.closest('#vli-pc-v24')||!activeUI())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(!gameReady()){message('Hãy chọn nhân vật trước.');return;}
    makeStore();
  }
  function makeEmotes(){
    if(emotes){emotes.hidden=!emotes.hidden;return;}
    const d=desktop();if(!d)return;
    emotes=node('section','pc248-emote-popup');emotes.id='pc248-emotes';emotes.setAttribute('aria-label','Bảng biểu tượng chat PC');
    const hitGrid=node('div','pc248-emote-hitgrid');
    for(let i=0;i<72;i++){
      const index=i+1;
      const b=pcButton('','pc248-emote-hit',()=>pickEmote(index));
      b.title='Biểu tượng PC '+index;b.setAttribute('aria-label',b.title);
      hitGrid.append(b);
    }
    emotes.append(hitGrid);d.append(emotes);
    positionEmotes();
  }
  function positionEmotes(){
    if(!emotes)return;const d=desktop(),bar=$('#pcv24-chatForm');if(!d||!bar)return;
    const rect=bar.getBoundingClientRect(),desk=d.getBoundingClientRect();
    emotes.style.left=Math.max(3,Math.min(d.clientWidth-247,rect.left-desk.left))+'px';
    emotes.style.top=Math.max(4,Math.min(d.clientHeight-214,rect.top-desk.top-218))+'px';
  }
  function pickEmote(index){
    const input=$('#pcv24-chatInput');if(!input)return;
    const token=':pc'+String(index).padStart(2,'0')+':';
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length;
    input.value=(input.value.slice(0,start)+token+input.value.slice(end)).slice(0,200);
    input.focus();const cursor=Math.min(input.value.length,start+token.length);input.setSelectionRange(cursor,cursor);
    if(emotes)emotes.hidden=true;
  }
  function stylizeChat(){
    const form=$('#pcv24-chatForm');if(!form||form.dataset.pc248)return;
    form.dataset.pc248='true';const submit=$('button[type="submit"]',form);
    const toggle=pcButton('','pc248-emote-toggle',()=>makeEmotes());
    toggle.title='Biểu tượng cảm xúc PC';toggle.setAttribute('aria-label','Mở biểu tượng chat PC');
    if(submit){submit.textContent='';form.insertBefore(toggle,submit);}else form.append(toggle);
    const input=$('#pcv24-chatInput',form);if(input)input.placeholder='Nhập nội dung trò chuyện...';
    const chat=$('#pcv24-chat');chat?.classList.add('pc248-chat');
  }
  function decorateChat(){
    const log=$('#pcv24-chatLog');if(!log)return;
    const regex=/:pc([0-7][0-9]):/g;
    for(const row of [...log.children]){
      if(row.dataset?.pc248Checked===row.textContent)continue;
      const str=row.textContent;
      if(!str?.includes(':pc'))continue;
      let hit=false,last=0;const out=document.createDocumentFragment();regex.lastIndex=0;
      for(const match of str.matchAll(regex)){
        const ix=Number(match[1]);if(ix<1||ix>72)continue;
        hit=true;out.append(document.createTextNode(str.slice(last,match.index)));
        const img=node('span','pc248-emote-inline');
        const idx=ix-1;img.style.backgroundPosition=`-${(idx%9)*25}px -${Math.floor(idx/9)*25}px`;
        img.setAttribute('role','img');img.setAttribute('aria-label','Biểu tượng PC '+ix);out.append(img);
        last=match.index+match[0].length;
      }
      if(hit){out.append(document.createTextNode(str.slice(last)));row.replaceChildren(out);row.dataset.pc248Checked=str;chatRendered++;}
    }
  }
  function classicDock(){
    const dock=$('#vli-pc-v24 .quick-dock');if(!dock)return;
    dock.classList.add('pc248-dock');
    for(const b of $$('button',dock)){
      const id=b.dataset.open||b.dataset.game||b.dataset.extra;
      if(!id||b.dataset.pc248Symbol)return;
      b.dataset.pc248Symbol=symbols[id]||(id==='ktc'?'◈':id==='admin'?'⚙':id==='tongkim'?'⚔':'✦');
      b.title=b.title||b.textContent.trim();
    }
  }
  function gameState(){try{return {s:typeof S!=='undefined'?S:null,r:typeof R!=='undefined'?R:null};}catch(_){return {s:null,r:null};}}
  function translateStat(name,value){const b=node('div','pc248-char-row');b.append(node('span',null,name));b.append(node('strong',null,value));return b;}
  function updateCharacter(){
    const win=$('#vli-pc-v24 .pc-window[data-panel="character"]');if(!win)return;
    if(!$('.pc248-char-stats',win)){
      const body=node('div','pc248-char-stats');win.append(body);
    }
    const box=$('.pc248-char-stats',win),{s,r}=gameState();
    if(!s)return;
    const hp=r?.P?.life,mp=r?.P?.mana;
    const data=[['Tên',s.name||''],['Môn phái',s.fac||''],['Cấp',s.lvl||0],
      ['Sinh lực',hp?`${Math.round(r.life||0)}/${Math.round(hp)}`:'—'],
      ['Nội lực',mp?`${Math.round(r.mana||0)}/${Math.round(mp)}`:'—'],
      ['Ngân lượng',pcFormat(s.gold||0)],['Sức mạnh',s.str??'—'],
      ['Thân pháp',s.dex??'—'],['Sinh khí',s.vit??'—'],['Nội công',s.int??'—']];
    const sig=JSON.stringify(data);if(box.dataset.sig===sig)return;box.dataset.sig=sig;
    box.replaceChildren(node('h3',null,'THUỘC TÍNH NHÂN VẬT'));
    for(const [name,value] of data)box.append(translateStat(name,value));
  }
  function updateSkills(){
    const win=$('#vli-pc-v24 .pc-window[data-panel="skills"]');if(!win)return;
    win.classList.add('pc248-skills');
    const wrap=$('.v242-skills-list',win);if(!wrap)return;
    if(!$('.pc248-skills-tabs',win)){
      const tabs=node('div','pc248-skills-tabs');
      const main=pcButton('Chiêu thức','active',()=>filterSkills('attack'));
      const support=pcButton('Kỹ năng sống','',()=>filterSkills('support'));
      main.dataset.filter='attack';support.dataset.filter='support';tabs.append(main,support);
      win.append(tabs);
    }
    if(!win.dataset.pc248Filter)win.dataset.pc248Filter='attack';
    filterSkills(win.dataset.pc248Filter,true);
  }
  function filterSkills(mode,silent){
    const win=$('#vli-pc-v24 .pc-window[data-panel="skills"]');if(!win)return;
    win.dataset.pc248Filter=mode;
    for(const b of $$('.pc248-skills-tabs button',win))b.classList.toggle('active',b.dataset.filter===mode);
    for(const b of $$('.v242-skill-item',win)){
      const id=Number(b.dataset.skillId);let attack=true;
      try{attack=typeof SK!=='undefined'&&SK[id]&&typeof isAttack==='function'?!!isAttack(SK[id]):true;}catch(_){}
      b.hidden=(mode==='attack'?!attack:attack);
    }
  }

  function relationPanel(id,win){
    if($('.pc248-social-view',win))return;
    const view=node('div','pc248-social-view pc248-'+id+'-view');
    function relationNotice(label){message(label+' chưa có xử lý trong dữ liệu Võ Lâm Offline hiện tại.');}
    const heading=node('h3',null,id==='guild'?'BANG PHÁI':id==='friends'?'LIÊN LẠC':'LẬP NHÓM');view.append(heading);
    if(id==='friends'){
      const names=['Hảo hữu','Thân nhân','Cừu nhân','Khác'];
      const nav=node('div','pc248-social-tabs');
      const body=node('div','pc248-social-empty');
      names.forEach((name,i)=>nav.append(pcButton(name,i?'':'active',()=>{
        $$('.pc248-social-tabs button',view).forEach(b=>b.classList.toggle('active',b.textContent===name));
        body.textContent='Danh sách '+name+' chưa được kết nối với chế độ offline.';
      })));
      view.append(nav,body);body.textContent='Danh sách Hảo hữu chưa được kết nối với chế độ offline.';
      const field=node('input','pc248-social-search');field.placeholder='Tìm nhân vật...';field.setAttribute('aria-label','Tìm nhân vật');view.append(field);
      view.append(pcButton('Tìm','pc248-social-action',()=>relationNotice('Tìm Hảo hữu')));
    }else if(id==='team'){
      const cols=node('div','pc248-team-cols');
      for(const label of ['Nhóm của mình','Người chơi']){
        const side=node('div','pc248-team-col');side.append(node('strong',null,label));
        side.append(node('p',null,'Chưa có dữ liệu tổ đội.'));cols.append(side);
      }
      view.append(cols);
      const buttons=node('div','pc248-social-actions');
      for(const label of ['Mời nhóm','Trục xuất','Cập nhật','Rời nhóm']){
        const b=pcButton(label,'pc248-social-action',()=>relationNotice(label));
        b.disabled=true;b.title='Tổ đội đang tạm đóng trong phiên bản game gốc';buttons.append(b);
      }
      view.append(buttons);
    }else if(id==='guild'){
      const tabs=node('div','pc248-social-tabs');
      const body=node('div','pc248-guild-body');
      ['Trưởng lão','Đường chủ','Môn đệ','Liên minh'].forEach((name,i)=>{
        tabs.append(pcButton(name,i?'':'active',()=>{
          $$('.pc248-social-tabs button',view).forEach(b=>b.classList.toggle('active',b.textContent===name));
          body.textContent='Chưa có dữ liệu '+name.toLowerCase()+' của bang hội trong bản offline.';
        }));
      });
      view.append(tabs,body);
      body.textContent='Bang hội chưa được nối với hệ thống lưu game. Các quyền hạn và thành viên không được giả lập.';
      const buttons=node('div','pc248-social-actions');
      ['Bang chủ','Bổ nhiệm','Cập nhật','Đổi tên bang'].forEach(label=>{
        const b=pcButton(label,'pc248-social-action',()=>relationNotice(label));b.disabled=true;buttons.append(b);
      });view.append(buttons);
    }
    const close=pcButton('Đóng','pc248-social-close',()=>window.VLI_PC_UI_V24_INTEGRATION?.closePanel(id));
    view.append(close);win.append(view);
  }
  function finishNativePanels(){
    const ids=['character','inventory','skills','team','guild','friends','messages'];
    for(const id of ids){const w=$(`#vli-pc-v24 .pc-window[data-panel="${id}"]`);if(!w)continue;
      w.classList.add('pc248-window');
      if(id==='character')updateCharacter();
      if(id==='skills')updateSkills();
      if(['team','guild','friends'].includes(id))relationPanel(id,w);
      if(['guild','friends','messages'].includes(id)){
        const note=$('.pc-not-ready',w);
        if(note){note.textContent='Giao diện '+(id==='guild'?'Bang phái':id==='friends'?'Hảo hữu':'Tin nhắn')+' PC đã sẵn sàng · chức năng này chưa có dữ liệu offline.';}
      }
    }
  }
  function closeTransient(e){
    if(e.key!=='Escape')return;
    if(emotes&&!emotes.hidden){emotes.hidden=true;e.stopImmediatePropagation();e.preventDefault();return;}
    if(ktc&&!ktc.hidden){closeStore();e.stopImmediatePropagation();e.preventDefault();}
  }
  function status(){return {version:VERSION,ready:initDone,uiIntegrated:activeUI(),
    chatPC:!!$('#pcv24-chatForm.pc248-chat')||!!$('#pcv24-chat.pc248-chat'),
    emojiButtons:$$('#pc248-emotes .pc248-emote-hit').length,pcShopOpen:!!ktc&&!ktc.hidden,
    goodsInGame:items().length,category,page,purchases,chatIconsRendered:chatRendered,nativeShopDelegated,
    lastError,saveModified:false,skillAnimationsModified:false,
    note:'PC-style UI from screenshot + original resources; not pixel-identical in every menu.'};}
  const api={version:VERSION,status,openShop:()=>makeStore(),closeShop:closeStore,
    openEmotes:()=>makeEmotes(),refresh:()=>{renderStore();finishNativePanels();decorateChat();}};
  window.VLI_PC_UI_V248=api;
  function init(){
    if(!activeUI()){lastError='Cần V24.1/V24.3 (vli-pc-v24) trước';return;}
    document.addEventListener('click',shopEvents,true);
    window.addEventListener('keydown',closeTransient,true);
    document.addEventListener('pointerdown',e=>{
      if(emotes&&!emotes.hidden&&!emotes.contains(e.target)&&!e.target.closest('.pc248-emote-toggle'))emotes.hidden=true;
    },true);
    wrapOriginalKtc();stylizeChat();makeEmotes();if(emotes)emotes.hidden=true;classicDock();finishNativePanels();
    window.VLI_PC_UI_V24_INTEGRATION?.on?.('panel.open',()=>setTimeout(finishNativePanels,0));
    window.addEventListener('resize',()=>{if(emotes&&!emotes.hidden)positionEmotes();});
    setInterval(()=>{if(!activeUI())return;wrapOriginalKtc();stylizeChat();classicDock();finishNativePanels();decorateChat();if(ktc&&!ktc.hidden)renderStore();},850);
    initDone=true;console.info('[VLI PC UI V24.8] ready',status());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
