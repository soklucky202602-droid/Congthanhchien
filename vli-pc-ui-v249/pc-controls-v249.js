/* Võ Lâm Idle H5 PC Client UI V24.9
 * UI-only bridge: native attribute modal, unified skills, inventory, item hotkeys,
 * two attack slots. Does not replace the game-save or combat implementation.
 */
(() => {
  'use strict';
  if (window.VLI_PC_UI_V249) return;
  const VERSION = '24.9.0';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const uiRoot = () => $('#vli-pc-v24 .pc-desktop');
  const panel = id => $(`#vli-pc-v24 .pc-window[data-panel="${id}"]`);
  const gameReady = () => {try {return typeof S !== 'undefined' && !!S?.fac;} catch(_) {return false;} };
  const hero = () => {try {return typeof S !== 'undefined' ? S : null;} catch(_) {return null;} };
  const game = () => {try {return typeof R !== 'undefined' ? R : null;} catch(_) {return null;} };
  const skills = () => {try {return typeof SK !== 'undefined' ? SK : {}; } catch(_) {return {};} };
  const notify = m => window.VLI_PC_UI_V24_INTEGRATION?.toast?.(m) || console.info('[V24.9]',m);
  const E = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const ATTR = [{key:'str',title:'Sức mạnh'}, {key:'dex',title:'Thân pháp'}, {key:'vit',title:'Sinh khí'}, {key:'eng',title:'Nội công'}];
  let enabled=false, error=null, renderCount=0, mainSelected=0, secondaryAssigned=0, manualAllocClicks=0;
  let inventoryItems=0, unifiedSkills=0, inventorySig='', charSig='', skillsSig='', hudSig='';
  function call(name, ...args){
    // Native V6 functions are declared in classic scripts. Defer to their own rules & save paths.
    try{
      if(name==='attrAddModal' && typeof attrAddModal==='function') return attrAddModal(...args);
      if(name==='selectPrimarySkillV8' && typeof selectPrimarySkillV8==='function') return selectPrimarySkillV8(...args);
      if(name==='assignSlot' && typeof assignSlot==='function') return assignSlot(...args);
      if(name==='skSlotModal' && typeof skSlotModal==='function') return skSlotModal(...args);
      if(name==='drinkNow' && typeof drinkNow==='function') return drinkNow(...args);
      if(name==='potSlotModal' && typeof potSlotModal==='function') return potSlotModal(...args);
      if(name==='goTown' && typeof goTown==='function') return goTown(...args);
      if(name==='backFromTown' && typeof backFromTown==='function') return backFromTown(...args);
      if(name==='pressSlot' && typeof pressSlot==='function') return pressSlot(...args);
      if(name==='itemModal' && typeof itemModal==='function') return itemModal(...args);
      if(name==='skillModal' && typeof skillModal==='function') return skillModal(...args);
      if(name==='slotShow' && typeof slotShow==='function') return slotShow(...args);
    } catch(ex){error=String(ex);console.error('[V24.9]',name,ex);notify('Không thực hiện được: '+name);return null;}
    notify('Chưa có chức năng trong game: '+name);return null;
  }
  function makeButton(label,cls,handler){const b=E('button',cls,label);b.type='button';b.addEventListener('click',handler);return b;}
  function attrAllocate(key){
    if(!gameReady())return notify('Hãy chọn nhân vật trước.');
    const s=hero();if(!(Number(s.attrPts)>0))return notify('Bạn không còn điểm tiềm năng.');
    manualAllocClicks++;
    call('attrAddModal',key);
  }
  function displayChar(){
    const w=panel('character'),s=hero(),r=game();if(!w||!gameReady()||!s?.attr)return;
    w.classList.add('pc249-character');
    let root=$('.pc249-character-content',w);
    if(!root){root=E('div','pc249-character-content');w.append(root);}
    const left=r?.P||{};
    const summary=[s.name,s.lvl,s.fac,s.attrPts, ...ATTR.map(a=>s.attr?.[a.key]), left.life,left.mana,r?.life,r?.mana].join('|');
    if(root.dataset.signature===summary)return;
    root.dataset.signature=summary;charSig=summary;
    const scroll=E('div','pc249-char-scroll');
    const name=E('div','pc249-char-name');name.append(E('span',null,'Tên'), E('strong',null,s.name||'Nhân vật'));scroll.append(name);
    const identity=E('div','pc249-char-line');identity.append(E('span',null,'Cấp '+(s.lvl||0)),E('span',null,'Môn phái: '+(s.fac||'—')));scroll.append(identity);
    const health=E('div','pc249-char-health');
    health.append(E('div',null,`Sinh lực: ${Math.floor(r?.life||0)}/${Math.floor(left.life||0)}`));
    health.append(E('div',null,`Nội lực: ${Math.floor(r?.mana||0)}/${Math.floor(left.mana||0)}`));
    scroll.append(health);
    const count=E('div','pc249-attr-remaining');
    count.append(E('span',null,'Điểm tiềm năng'),E('strong',null,String(s.attrPts||0)));
    scroll.append(count);
    const box=E('div','pc249-attribute-list');
    for(const attr of ATTR){
      const row=E('div','pc249-attribute-row');
      row.append(E('span','pc249-attribute-name',attr.title));
      row.append(E('b','pc249-attribute-value',String(Math.round(Number(left[attr.key] ?? s.attr[attr.key])||0))));
      const plus=makeButton('+','pc249-attr-add',()=>attrAllocate(attr.key));
      plus.title='Cộng điểm '+attr.title+' · mở bảng cộng điểm gốc';
      plus.disabled=!(Number(s.attrPts)>0);
      plus.dataset.attr=attr.key;
      plus.setAttribute('aria-label','Cộng điểm '+attr.title);
      row.append(plus);box.append(row);
    }
    scroll.append(box);
    scroll.append(E('div','pc249-attr-note','Nhấn + để chọn số điểm, xác nhận và lưu.'));
    root.replaceChildren(scroll);renderCount++;
  }
  function skillIDs(s){
    const sk=skills();const ids=Object.keys(s?.sk||{}).filter(id=>Number(s.sk[id])>0&&sk[id]);
    ids.sort((a,b)=>(Number(sk[a].req)||0)-(Number(sk[b].req)||0)||Number(a)-Number(b));
    return ids;
  }
  function skillIsAttack(sk){try{return typeof isAttack==='function' ? !!isAttack(sk) : sk.kind==='attack';}catch(_){return false;} }
  function makePrimary(id){
    if(!gameReady())return;
    const skill=skills()[id];if(!skill)return;
    if(!skillIsAttack(skill))return call('skillModal',Number(id));
    if(call('selectPrimarySkillV8',Number(id),false)===true){mainSelected++;notify('Chiêu chính: '+skill.n);}else notify('Kỹ năng không được phép dùng làm chiêu chính.');
    hudSig='';
  }
  function makeSecondary(id){
    if(!gameReady())return;
    const skill=skills()[id];if(!skill||!skillIsAttack(skill))return notify('Chỉ gán chiêu tấn công vào ô bên phải.');
    if(typeof assignSlot!=='function')return notify('Bản game chưa có chức năng gán ô kỹ năng.');
    call('assignSlot',1,Number(id));secondaryAssigned++;
    notify('Đã gán ô đánh bên phải: '+skill.n);hudSig='';
  }
  function drawSkills(){
    const w=panel('skills'),s=hero();if(!w||!gameReady())return;
    w.classList.add('pc249-skills');
    let root=$('.pc249-unified-skills',w);
    if(!root){
      root=E('section','pc249-unified-skills');
      root.append(E('div','pc249-skill-heading','TOÀN BỘ VÕ CÔNG'));
      root.append(E('div','pc249-skill-grid'));
      w.append(root);
    }
    const ids=skillIDs(s),sk=skills();unifiedSkills=ids.length;
    const signature=ids.map(id=>id+':'+s.sk[id]).join('|')+'|'+(game()?.P?.main?.id||0)+'|'+(s?.slots||[]).join(',');
    if(root.dataset.signature===signature)return;
    root.dataset.signature=signature;skillsSig=signature;
    const grid=$('.pc249-skill-grid',root);grid.replaceChildren();
    if(!ids.length)grid.append(E('p','pc249-no-skills','Chưa có kỹ năng đã học.'));
    for(const id of ids){
      const skill=sk[id],attack=skillIsAttack(skill);
      const b=makeButton('','pc249-skill-cell',()=>makePrimary(id));
      b.dataset.id=id;
      b.title=skill.n+' · cấp '+s.sk[id]+(attack?' · bấm: chọn chiêu chính; nhấp phải: gán ô đánh bên phải':' · bấm: xem kỹ năng');
      b.classList.toggle('pc249-skill-active',Number(game()?.P?.main?.id)===Number(id));
      if(skill.ic){const i=E('img');i.src=skill.ic;i.alt='';i.loading='lazy';b.append(i);}
      b.append(E('small',null,String(s.sk[id])));
      if(!attack)b.classList.add('pc249-support-skill');
      b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();makeSecondary(id);});
      grid.append(b);
    }
    renderCount++;
  }
  function drawInventory(){
    const w=panel('inventory'),s=hero();if(!w||!gameReady()||!Array.isArray(s.inv))return;
    w.classList.add('pc249-inventory');
    // Keep V24.3 native 60-cell model and its itemModal action. Add actual empty cells
    // to preserve a fixed 6x10 PC layout; never clone or consume inventory items.
    const grid=$('.v242-inv-grid',w);if(!grid)return;
    const sig=grid.dataset.sig||'';
    const real=$$('button.v242-inv-item',grid).length;
    const marker=sig+'|'+real+'|'+s.inv.length;
    if(inventorySig===marker)return;inventorySig=marker;
    inventoryItems=real;
    $$('.pc249-inv-empty',grid).forEach(n=>n.remove());
    for(let i=real;i<60;i++){
      const empty=makeButton('','pc249-inv-empty',()=>{});empty.disabled=true;
      empty.setAttribute('aria-label','Ô hành trang trống '+(i+1));grid.append(empty);
    }
    if(!$('.pc249-bag-count',w)){const count=E('div','pc249-bag-count');w.append(count);}
    const count=$('.pc249-bag-count',w);count.textContent='Túi '+s.inv.length+' vật phẩm';
    renderCount++;
  }
  function hotbar(){
    const hud=$('#vli-pc-v24 .pc-hud');if(!hud)return;
    if($('.pc249-itembar',hud))return;
    const row=E('div','pc249-itembar');
    const setup=[
      {key:1,name:'Sinh lực',action:()=>call('drinkNow','life'),alt:()=>call('potSlotModal',0)},
      {key:2,name:'Nội lực',action:()=>call('drinkNow','mana'),alt:()=>call('potSlotModal',1)},
      {key:3,name:'Thổ Địa Phù',action:()=>{const r=game();return r?.town?call('backFromTown'):call('goTown');}}
    ];
    for(const info of setup){
      const b=makeButton('','pc249-item-hotkey',info.action);b.dataset.key=String(info.key);
      b.setAttribute('aria-label','Ô '+info.key+' · '+info.name);
      b.append(E('span','pc249-hotkey-number',String(info.key)),E('span','pc249-hotkey-visual'));
      b.title='Phím '+info.key+' · '+info.name;
      if(info.alt)b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();info.alt();});
      row.append(b);
    }
    hud.append(row);
    const attack=E('div','pc249-attacks');
    for(let i=0;i<2;i++){
      const slot=i;
      const b=makeButton('','pc249-attack-hotkey',()=>{if(!gameReady())return;call('pressSlot',slot);});
      b.dataset.slot=String(slot);
      b.append(E('span','pc249-skill-image'),E('span','pc249-attack-label',slot===0?'Trái':'Phải'));
      b.title=slot===0?'Chiêu đánh trái · bấm để chọn/thi triển':'Chiêu đánh phải · bấm để chọn/thi triển';
      b.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();call('skSlotModal',slot);});
      attack.append(b);
    }
    hud.append(attack);
    hud.classList.add('pc249-hud');renderCount++;
  }
  function updateHotbar(){
    const hud=$('#vli-pc-v24 .pc-hud'),s=hero(),r=game();if(!hud||!s)return;
    const sk=skills();
    let life=null,mana=null;
    try{life=typeof slotShow==='function'?slotShow(0):null;mana=typeof slotShow==='function'?slotShow(1):null;}catch(_){ }
    const sig=[life?.ic,life?.n,mana?.ic,mana?.n,s.slots?.[0],s.slots?.[1],r?.P?.main?.id,r?.town].join('|');
    if(sig===hudSig)return;hudSig=sig;
    for(const [idx,output] of [[1,life],[2,mana]]){
      const b=$(`.pc249-item-hotkey[data-key="${idx}"]`,hud);if(!b)continue;
      const visual=$('.pc249-hotkey-visual',b);
      visual.replaceChildren();
      const image=E('img');image.src='vli-pc-ui-v249/assets/'+(idx===1?'pc-life.png':'pc-mana.png');
      image.alt='';visual.append(image);
      const number=E('span','pc249-item-count',String(output?.n||0));visual.append(number);
      b.title=`Phím ${idx}: ${output?.name||(idx===1?'Sinh lực':'Nội lực')} · còn ${output?.n||0}; chuột phải chọn thuốc`;
    }
    const tp=$('.pc249-item-hotkey[data-key="3"] .pc249-hotkey-visual',hud);
    if(tp){
      tp.replaceChildren();
      if(r?.town){tp.textContent='↩';tp.title='Trở lại bãi luyện';}
      else{const im=E('img');im.src='vli-pc-ui-v249/assets/pc-town-scroll.png';im.alt='';tp.append(im);tp.title='Thổ Địa Phù';}
    }
    for(const b of $$('.pc249-attack-hotkey',hud)){
      const idx=Number(b.dataset.slot),id=Number(s.slots?.[idx])||0,k=sk[id];
      const image=$('.pc249-skill-image',b);
      image.style.backgroundImage=k?.ic?`url("${String(k.ic).replace(/"/g,'%22')}")`:'none';
      b.classList.toggle('pc249-current',id>0&&Number(r?.P?.main?.id)===id);
      b.title=k?`${idx===0?'Ô đánh trái':'Ô đánh phải'}: ${k.n} · bấm chọn chiêu; chuột phải đổi`:`Ô đánh ${idx===0?'trái':'phải'} trống · bấm để chọn chiêu`;
    }
  }
  function redraw(){
    if(!uiRoot())return;
    hotbar();if(!gameReady())return;
    displayChar();drawSkills();drawInventory();updateHotbar();
  }
  function status(){return {version:VERSION,ready:enabled,gameReady:gameReady(),
    pcUI:!!uiRoot(),characterPlusButtons:$$('#vli-pc-v24 .pc249-attr-add').length,
    allSkillsInOnePanel:!!panel('skills')?.querySelector('.pc249-unified-skills'),
    learnedSkills:unifiedSkills,inventoryEntries:inventoryItems,
    consumableKeys:$$('#vli-pc-v24 .pc249-item-hotkey').length,
    rightAttackSlots:$$('#vli-pc-v24 .pc249-attack-hotkey').length,
    manualAllocClicks,mainSelected,secondaryAssigned,renderCount,lastError:error,
    saveModified:false,note:'UI-only; retains native V6 save, gameplay, attrAddModal and slot assignment.'};}
  window.VLI_PC_UI_V249={version:VERSION,status,refresh:redraw};
  function init(){
    if(!uiRoot()){error='Chưa nạp giao diện PC V24 (bridge.js)';console.warn('[PC UI V24.9]',error);return;}
    enabled=true;
    redraw();
    const api=window.VLI_PC_UI_V24_INTEGRATION;
    api?.on?.('panel.open',()=>setTimeout(redraw,30));
    setInterval(redraw,550);
    console.info('[Võ Lâm PC UI V24.9] Sẵn sàng',status());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
