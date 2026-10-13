/* V23 PC presentation. All gameplay actions remain in the V6 engine. */
(function(){
 'use strict';
 const $id=id=>document.getElementById(id), root='ui/pc-v23/';
 const ui={built:false,skillPage:0,skillKind:'all',assets:[],errors:[],tkBackground:false,oldBackground:null};
 const ready=()=>typeof S!=='undefined'&&S&&S.fac;
 const desktop=()=>innerWidth>=800&&innerHeight>=560&&innerWidth>innerHeight;
 const enabled=()=>desktop()&&document.body.classList.contains('u20');
 const html=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const actions=[['char','Nhân vật','F5'],['inv','Hành trang','F6'],['skill','Võ công','F7'],['quest','Nhiệm vụ','F8'],['team','Tổ đội',''],['forge','Lò rèn',''],['more','Hệ thống','F10']];
 function launch(name){
  if(!ready())return false;
  try{
   if(actions.some(a=>a[0]===name)&&name!=='team'){u20Toggle(name);return true;}
   switch(name){
    case 'team':
     if(typeof PARTY_CLOSED!=='undefined'&&PARTY_CLOSED)modal('<h3>Tổ đội</h3><p>Chức năng tổ đội đã bị khóa trong nguồn V6. Bản offline hiện tại không có kết nối người chơi để mời hoặc lập nhóm.</p>');
     else ptModal();break;
    case 'tk':vliTkOpen();break;
    case 'auto':u20Tt('basic');break;
    case 'gift':giftModal(true);break;
    case 'ktc':ktcModal();break;
    case 'gear':window.VLIHighGear130.open();break;
    case 'activities':actModal('dg');break;
    case 'map':u20ZoneList();break;
    case 'stash':stashModal();break;
    case 'admin':if(window.VLIAdminCP)window.VLIAdminCP.open();break;
    case 'log':$id('u20ct').querySelector('[data-lt="sys"]').click();break;
    default:return false;
   }
   return true;
  }catch(e){ui.errors.push(name+': '+e.message);console.error('[PC V23]',name,e);if(typeof toast==='function')toast('Không mở được '+name);return false;}
 }
 function button(action,label,key){return `<button type="button" data-pc23="${action}" title="${label}${key?' ('+key+')':''}" aria-label="${label}">${label}${key?'<small>'+key+'</small>':''}</button>`;}
 function mount(){
  if(ui.built||!$id('u20menu'))return;
  const shell=document.createElement('div');shell.id='pc23-shell';
  shell.innerHTML=`<div id="pc23-name"></div><div id="pc23-controls"></div><nav id="pc23-activities" aria-label="Hoạt động">${[['tk','Tống Kim'],['activities','Hoạt động'],['gift','Phần thưởng'],['ktc','Kỳ Trân Các'],['auto','Trợ thủ'],['gear','Đồ 130+'],['admin','AdminCP']].map(a=>button(...a)).join('')}</nav><div id="pc23-miniframe" aria-hidden="true"></div><div id="pc23-maplabel"></div><div id="pc23-hud" aria-label="Thanh kỹ năng"></div><nav id="pc23-menu" aria-label="Cửa sổ PC">${actions.map(a=>button(...a)).join('')}</nav><div id="pc23-money"></div>`;
  document.body.appendChild(shell);
  shell.addEventListener('click',e=>{const b=e.target.closest('[data-pc23]');if(b){e.stopPropagation();launch(b.dataset.pc23);}});
  for(const id of ['rideBtn','rotBtn','ctrlBtn'])$id('pc23-controls').appendChild($id(id));
  $id('pc23-maplabel').appendChild($id('u20zb'));
  const oldMain=$id('bMain').onclick;$id('bMain').onclick=()=>enabled()?launch('skill'):oldMain?.();
  const panel=$id('panel'),header=$id('u20wh');let drag=null;
  header.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};});
  header.addEventListener('pointermove',e=>{if(!drag||!enabled())return;panel.dataset.pc23Dragged='1';const left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,drag.left+e.clientX-drag.x)),top=Math.max(0,Math.min(innerHeight-32,drag.top+e.clientY-drag.y));panel.style.setProperty('left',left+'px','important');panel.style.setProperty('right','auto','important');panel.style.setProperty('top',top+'px','important');});
  for(const ev of ['pointerup','pointercancel'])header.addEventListener(ev,()=>{drag=null;});
  ui.built=true;
 }
 function drawBattleMini(){
  const host=$id('pc23-miniframe');let c=$id('pc23-tkmini');
  const on=typeof TK!=='undefined'&&TK.on;
  if(!c){c=document.createElement('canvas');c.id='pc23-tkmini';c.width=c.height=128;host.appendChild(c);}
  c.hidden=!on;if(!on)return;
  const ctx=c.getContext('2d');ctx.fillStyle='#1b271b';ctx.fillRect(0,0,128,128);
  const bg=img('ui/vli-v10/tongkim.jpg');if(bg?.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,128,128);
  for(const e of TK.ents||[]){if(e.dead)continue;ctx.fillStyle=e.side==='song'?'#67dd91':'#ef715e';ctx.fillRect(e.x/TK_MAP_W*128-1,e.y/TK_MAP_H*128-1,3,3);}
  ctx.fillStyle='#ffe09a';ctx.fillRect(H.x/TK_MAP_W*128-2,H.y/TK_MAP_H*128-2,5,5);
 }
 function renderPcSkills(){
  document.body.dataset.u2t='skill';
  const fac=FAC[S.fac];if(fac.novice){renderSkill20();return;}
  const all=fac.skills.map(id=>SK[id]).filter(Boolean);
  const list=ui.skillKind==='assist'?all.filter(s=>!isAttack(s)):all;
  const pages=Math.max(1,Math.ceil(list.length/30));ui.skillPage=Math.max(0,Math.min(pages-1,ui.skillPage));
  const cells=Array.from({length:30},(_,i)=>{
   const sk=list[ui.skillPage*30+i];if(!sk)return '<span class="pc23-skempty"></span>';
   const learned=S.sk[sk.id]||0,bonus=learned?skillBonusLv(sk.id):0;
   return `<div class="pc23-skill ${learned?'learned':''} ${R.P.main.id===sk.id?'primary':''}"><button data-pc23-skill="${sk.id}" title="${html(sk.n)} · học ${learned}/${sk.max||20} · trang bị +${bonus}"><img src="${html(sk.ic||'img/s/8.png')}" alt="${html(sk.n)}"></button><span>${learned?learned+bonus:0}</span>${canLearn(sk)?`<button class="pc23-plus" data-pc23-learn="${sk.id}" aria-label="Cộng điểm ${html(sk.n)}">+</button>`:''}</div>`;
  }).join('');
  $id('t-skill').innerHTML=`<div class="pc23-skillbook"><h3>Kỹ năng võ công</h3><div class="pc23-sktabs"><button data-pc23-filter="all" class="${ui.skillKind==='all'?'on':''}">Chiêu thức</button><button data-pc23-filter="assist" class="${ui.skillKind==='assist'?'on':''}">Hỗ trợ</button></div><div class="pc23-skgrid">${cells}</div><div class="pc23-skpoints">Điểm còn: <b>${S.skPts}</b></div><div class="pc23-pages"><button data-pc23-page="-1" ${ui.skillPage?'':'disabled'}>◀</button><span>${ui.skillPage+1}/${pages}</span><button data-pc23-page="1" ${ui.skillPage<pages-1?'':'disabled'}>▶</button></div><div class="pc23-sktools"><button id="pc23-suggest">Gợi ý</button><button id="pc23-reset">Tẩy Tủy</button><button data-pc23="auto">Trợ thủ</button></div><button class="pc23-skclose" id="pc23-skclose">Đóng</button></div>`;
  $id('pc23-suggest').onclick=suggestModal;$id('pc23-reset').onclick=tayTuyModal;$id('pc23-skclose').onclick=u20Close;
 }
 function patchSkills(){
  const original=renderSkill;
  renderSkill=function(){if(enabled()&&ready())return renderPcSkills();return original.apply(this,arguments);};
  $id('t-skill').addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||!enabled())return;
   if(b.dataset.pc23Skill){skillModal(+b.dataset.pc23Skill);return;}
   if(b.dataset.pc23Learn){const id=+b.dataset.pc23Learn;if(canLearn(SK[id])&&skLearn(id)){R.dirty=true;recalc();renderPad();save();renderSkill();}return;}
   if(b.dataset.pc23Page){ui.skillPage+=+b.dataset.pc23Page;renderSkill();return;}
   if(b.dataset.pc23Filter){ui.skillKind=b.dataset.pc23Filter;ui.skillPage=0;renderSkill();return;}
   if(b.dataset.pc23)launch(b.dataset.pc23);
  });
 }
 function patchWindows(){
  const char=renderChar,inv=renderInv;
  renderChar=function(){
   const result=char.apply(this,arguments);if(!enabled()||!ready())return result;
   const footer=document.createElement('div');footer.className='pc23-charfoot';
   footer.innerHTML='<button type="button" id="pc23-charbag">Hành trang</button><button type="button" id="pc23-charclose">Đóng</button>';
   $id('t-char').appendChild(footer);$id('pc23-charbag').onclick=()=>u20Open('inv');$id('pc23-charclose').onclick=u20Close;
   return result;
  };
  renderInv=function(){
   const result=inv.apply(this,arguments);if(!enabled()||!ready())return result;
   for(const [id,label] of [['bBest','Mặc đồ'],['bDonKho','Dọn kho'],['bStash','Kho'],['u2kren','Kho rèn'],['bSellAll','Bán đồ thừa'],['u2filt','Bộ lọc']]){
    const b=$id(id);if(b){b.title=b.textContent;b.textContent=label;}
   }
   return result;
  };
 }
 function align(){
  mount();if(!ui.built)return;
  const on=enabled();document.body.classList.toggle('pc23',on);
  const pad=$id('pad'),host=on?$id('pc23-hud'):$id('battle');if(pad.parentNode!==host)host.appendChild(pad);
  if(!on){const p=$id('panel');if(p.dataset.pc23Dragged){delete p.dataset.pc23Dragged;for(const k of ['left','right','top'])p.style.removeProperty(k);}return;}
  document.body.classList.remove('compact');
  // Only canvas presentation coordinates change, never world/actor coordinates.
  if(typeof MINI!=='undefined'){MINI.s=128;MINI.top=12;MINI.m=12;}
  drawBattleMini();
  if(ready()){
   const tk=typeof TK!=='undefined'&&TK.on;
   $id('u20zb').disabled=tk;
   if(tk){if(!ui.tkBackground){ui.oldBackground=R.bgImg;ui.tkBackground=true;}R.bgImg=img('ui/vli-v10/tongkim.jpg');}
   else if(ui.tkBackground){if(R.bgImg===img('ui/vli-v10/tongkim.jpg'))R.bgImg=ui.oldBackground;ui.tkBackground=false;ui.oldBackground=null;}
   const name=(S.name||FAC[S.fac].n)+' · Cấp '+S.lvl;
   if($id('pc23-name').textContent!==name)$id('pc23-name').textContent=name;
   $id('pc23-money').textContent='Ngân lượng '+fmtL(S.gold)+' · KNB '+fmt(S.knb||0);
  }
  $id('pc23-menu').querySelectorAll('button').forEach(b=>{
   const pressed=document.body.classList.contains('u20win')&&document.body.dataset.u2t===b.dataset.pc23;
   if(b.getAttribute('aria-pressed')!==String(pressed))b.setAttribute('aria-pressed',String(pressed));
  });
 }
 function inspect(){return {version:'23.0',enabled:document.body.classList.contains('pc23'),source:['Ui.pak','spr.pak'],layout:'native-PC-window-shell',gameplayModified:false,saveSchemaModified:false,verifiedPixelPerfect:false,window:document.body.dataset.u2t,errors:ui.errors.slice(),buttons:$id('pc23-menu')?.children.length||0};}
 async function auditAssets(){return Promise.all(['inventory.webp','character.webp','skills.webp','hud.webp','health.webp','mana.webp','close.webp','pc-frame-nine-slice.webp'].map(file=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve({file,loaded:true,width:im.naturalWidth,height:im.naturalHeight});im.onerror=()=>resolve({file,loaded:false});im.src=root+file;})));}
 function boot(){if(typeof renderSkill!=='function'||!$id('t-skill'))return;patchSkills();patchWindows();align();setInterval(align,250);addEventListener('resize',align);addEventListener('keydown',e=>{
  if(!enabled()||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.repeat)return;
  if(e.key==='Escape'&&$id('modal').classList.contains('hidden')){u20Close();return;}
  const a=actions.find(a=>a[2]===e.key);if(a){e.preventDefault();launch(a[0]);}
 });}
 window.VLI_PC_UI_V23={status:inspect,openWindow:launch,auditAssets};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
