/* VLI V8 JX desktop user interface. Presentation + delegated built-in actions only.
   Does not replace S.main, auto-combat or any save-game structures. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id);
 let built=false, lastMini='', lastName='', lastMain='', lastGold='';
 const icon=(glyph)=>'<i aria-hidden="true">'+glyph+'</i>';
 function act(name){
  try{
   switch(name){
    case 'questmode': if(typeof setMode==='function')setMode('quest'); break;
    case 'farmmode': if(typeof setMode==='function')setMode('farm'); break;
    case 'dgmode': if(typeof setMode==='function')setMode('dg'); break;
    case 'towermode': if(typeof setMode==='function')setMode('tower'); break;
    case 'tk': if(typeof vliTkOpen==='function')vliTkOpen();else if(typeof tkOpenModal==='function')tkOpenModal();break;
    case 'gift': if(typeof giftModal==='function')giftModal(true); break;
    case 'ktc': if(typeof ktcModal==='function')ktcModal(); break;
    case 'auto': if(typeof u20Tt==='function')u20Tt('basic');else if(typeof u20Helper==='function')u20Helper();break;
    case 'journal': document.body.classList.toggle('v8-logopen'); break;
    case 'char': case 'inv': case 'skill': case 'forge': case 'quest': case 'more':
      if(typeof u20Toggle==='function')u20Toggle(name);else if(typeof showTab==='function')showTab(name);break;
    case 'team': if(typeof ptModal==='function')ptModal();break;
    case 'mount': if(typeof toggleMount==='function')toggleMount();break;
    case 'expand': if(typeof invExpandModal==='function')invExpandModal();else if(typeof u20Open==='function')u20Open('inv'); break;
    case 'admin': {if(window.VLIAdminCP&&typeof window.VLIAdminCP.open==='function')window.VLIAdminCP.open();else{const node=byId('vliacp-u20')||byId('vliacp-open')||document.querySelector('[data-vliacp-open]');if(node)node.click();else if(typeof toast==='function')toast('AdminCP chưa sẵn sàng.');}break;}
    case 'today': if(typeof actModal==='function')actModal('dg');else if(typeof openQuest==='function')openQuest('act');break;
   }
  }catch(err){console.warn('[V8] action',name,err);if(typeof toast==='function')toast('Không mở được chức năng: '+name);}
 }
 function makeButton(cls,action,label,glyph){
  const b=document.createElement('button');b.type='button';b.className=cls;b.dataset.v8act=action;b.title=label;b.setAttribute('aria-label',label);
  if(cls==='v8action')b.innerHTML='<span class="v8ico" aria-hidden="true">'+glyph+'</span><span>'+label+'</span>';
  else if(cls==='v8side')b.innerHTML=icon(glyph)+'<span>'+label+'</span>';
  else b.innerHTML='<span class="v8tileico" style="background-image:url(ui/jx1/nav_'+glyph+'.png)" aria-hidden="true"></span><span class="v8mini">'+label+'</span>';
  return b;
 }
 function mount(){
  if(built||!byId('battle')||!byId('pad')||!byId('u20menu'))return false;
  const left=document.createElement('div');left.id='v8left';
  left.innerHTML='<div class="v8name" id="v8name">Võ Lâm Idle · 2.0</div><div class="v8main">Chiêu chính: <b id="v8main">—</b> · <span class="v8currency" id="v8money">0 lượng</span></div><div class="v8actions" id="v8actions"></div><div class="v8note" id="v8note">Võ Lâm Offline · luyện công</div>';
  for(const a of [['questmode','Vượt ải','⚔'],['farmmode','Luyện công','☯'],['dgmode','Công thành','♜'],['tk','Tống Kim','⚑'],['towermode','Leo tháp','♜']])left.querySelector('#v8actions').appendChild(makeButton('v8action',a[0],a[1],a[2]));
  document.body.appendChild(left);
  const maphead=document.createElement('div');maphead.id='v8maptitle';maphead.textContent='BẢN ĐỒ';document.body.appendChild(maphead);
  const frame=document.createElement('div');frame.id='v8mapframe';document.body.appendChild(frame);
  const right=document.createElement('div');right.id='v8right';
  for(const a of [['journal','Nhật ký','▤'],['gift','Quà','🎁'],['auto','Tự cày','⚔'],['today','Hôm nay','▣'],['inv','Túi đồ','♟'],['forge','Lò rèn','⚒'],['skill','Võ công','✦'],['expand','Mở rộng','⋯']])right.appendChild(makeButton('v8side',a[0],a[1],a[2]));
  document.body.appendChild(right);
  const bar=document.createElement('div');bar.id='v8bar';bar.setAttribute('aria-label','Thanh kỹ năng và chức năng Võ Lâm');
  const wing=(a)=>{const d=document.createElement('div');d.className='v8wing';for(const n of a){const b=makeButton('v8tile',n[0],n[1],n[2]);d.appendChild(b)}return d};
  bar.appendChild(wing([['char','Nhân vật','char'],['inv','Hành trang','inv'],['skill','Võ công','skill'],['quest','Nhiệm vụ','quest'],['team','Tổ đội','log']]));
  const center=document.createElement('div');center.className='v8center';center.appendChild(byId('pad'));bar.appendChild(center);
  bar.appendChild(wing([['forge','Lò rèn','forge'],['today','Hoạt động','quest'],['ktc','Kỳ Trân Các','inv'],['admin','AdminCP','more'],['mount','Ngựa','char']]));
  byId('battle').appendChild(bar);
  // Delegate: no duplicate handler on gameplay's original controls.
  for(const root of [left,right,bar])root.addEventListener('click',e=>{const b=e.target.closest('[data-v8act]');if(!b)return;e.stopPropagation();act(b.dataset.v8act);});
  built=true;return true;
 }
 function setMinimap(){
  if(!document.body.classList.contains('v8-jx'))return;
  if(typeof MINI!=='undefined'&&MINI){MINI.s=150;MINI.top=52;MINI.m=9;}
 }
 function apply(){
  if(!built&&!mount())return;
  const desktop=window.innerWidth>=900&&window.innerWidth>window.innerHeight&&window.innerHeight>=560;
  const available=document.body.classList.contains('u20');
  const useV8=desktop&&available;
  document.body.classList.toggle('v8-jx',useV8);
  // Mobile keeps its original V6 skillbar. Move it into V8 only on desktop.
  const originalPad=byId('pad'),target=useV8?document.querySelector('#v8bar .v8center'):byId('battle');
  if(originalPad&&target&&originalPad.parentElement!==target)target.appendChild(originalPad);
  if(useV8){
   // Old compact setting is UI-only. It must not hide the V8 desktop screen.
   document.body.classList.remove('compact');
   setMinimap();
  }else document.body.classList.remove('v8-logopen');
 }
 function update(){
  if(!built)apply();if(!document.body.classList.contains('v8-jx'))return;
  setMinimap();
  if(typeof S==='undefined'||!S||!S.fac)return;
  try{
   const faction=typeof FAC!=='undefined'&&FAC[S.fac]?FAC[S.fac].n:'Võ Lâm';
   const name=faction+' · 2.0';if(name!==lastName){byId('v8name').textContent=name;lastName=name;}
   const main=typeof R!=='undefined'&&R.P&&R.P.main?R.P.main.n:'—';if(main!==lastMain){byId('v8main').textContent=main;lastMain=main;}
   const money=typeof fmtL==='function'?fmtL(S.gold):String(S.gold||0);if(money!==lastGold){byId('v8money').textContent='🪙 '+money;lastGold=money;}
   const zone=typeof R!=='undefined'&&R.town?'Thành thị':typeof R!=='undefined'&&R.dg?'Phó bản':typeof zoneOf==='function'?zoneOf(Math.min(S.stage,typeof STAGES==='number'?STAGES:S.stage)).n:'Bản đồ';
   if(zone!==lastMini){byId('v8maptitle').textContent=zone;lastMini=zone;}
   const mode=S.mode||'farm';const text=mode==='quest'?'Nhiệm vụ':mode==='tower'?'Leo tháp':mode==='dg'?'Phó bản':'Luyện công';byId('v8note').textContent='V8 · '+text+' · Cấp '+S.lvl;
   document.querySelectorAll('#v8actions [data-v8act]').forEach(b=>b.classList.toggle('on',({questmode:'quest',farmmode:'farm',dgmode:'dg',towermode:'tower'})[b.dataset.v8act]===mode));
  }catch(err){console.warn('[V8] status',err);}
 }
 let tries=0;
 function boot(){if(!mount()){if(++tries<40)setTimeout(boot,250);return;}apply();update();
  window.addEventListener('resize',()=>{setTimeout(()=>{apply();update()},60)});
  setInterval(()=>{apply();update()},500);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
