/* VLI PC UI V22.0: original Kingsoft PC window sprites layered onto the existing offline game.
 * UI-only enhancement of installed V21. NO character saves, combat, skill, auto, or inventory state mutated.
 * Source: user-provided Ui.pak and spr.pak. Core gameplay still belongs to the user's H5 installation.
 */
(function(){
 'use strict';
 if(window.VLI_PC_UI_V22)return;
 var VERSION='22.0';
 var KEY='VLI_PC_UI_V22_ENABLED',LAYOUT_KEY='VLI_PC_UI_V22_LAYOUT',DOCK_KEY='VLI_PC_UI_V22_DOCK';
 var ROOT='ui/pc-v22/';
 var pref=true,layout='classic',dockVisible=true,ready=false,scheduled=false,watcher=null;
 var assets=['pc-frame-nine-slice.webp','pc-ui-frame-nine-slice.webp','pc-native-dock-button.webp',
  'pc-original-bottom-hud.webp','pc-original-inventory.webp','pc-original-character.webp',
  'pc-original-martial-skills.webp','pc-original-ui-health-red.webp','pc-original-ui-health-blue.webp',
  'pc-original-ui-close.webp','pc-header-ornament.webp','pc-footer-ornament.webp',
  'pc-native-hud-left.webp','pc-native-hud-right.webp','pc-native-hud-toolbar.webp'];
 function storageGet(k){try{return localStorage.getItem(k);}catch(_){return null;}}
 function storageSet(k,v){try{localStorage.setItem(k,v);}catch(_){}}
 pref=storageGet(KEY)!=='0';
 layout=storageGet(LAYOUT_KEY)==='adaptive'?'adaptive':'classic';
 dockVisible=storageGet(DOCK_KEY)!=='0';
 function el(id){return document.getElementById(id);}
 function desktop(){return innerWidth>=900 && innerHeight>=560 && innerWidth>innerHeight;}
 function playing(){return !!el('battle')&&!!el('panel')&&document.body&&document.body.classList.contains('u20');}
 function v21(){return !!(document.body&&document.body.classList.contains('vli-pc-ui-v21'));}
 function active(){return !!(pref&&desktop()&&playing()&&v21());}
 function skinRealButtons(){
  var candidates=document.querySelectorAll('#panel button,#modal button');
  for(var i=0;i<candidates.length;i++){
   var b=candidates[i];
   if(b.classList.contains('v21-native-button')||b.classList.contains('pcui-native-button'))continue;
   if(b.classList.contains('v22-skin-button'))continue;
   if((b.textContent||'').trim() || b.querySelector('img,svg')) b.classList.add('v22-skin-button');
  }
 }
 function createToggle(){
  if(!playing())return;
  var target=document.querySelector('#v8left .v8actions')||el('top')||el('v8left');
  if(!target)return;
  var toggle=el('v22-toggle');
  if(!toggle){
   toggle=document.createElement('button');
   toggle.type='button';toggle.id='v22-toggle';toggle.className='v8action';
   toggle.title='Bật/tắt giao diện gốc PC V22 (Alt+Shift+O)';
   toggle.setAttribute('aria-label','Bật/tắt giao diện PC V22');
   var icon=document.createElement('span');icon.className='v8ico';icon.textContent='✥';icon.setAttribute('aria-hidden','true');
   var label=document.createElement('span');label.textContent='PC V22';
   toggle.appendChild(icon);toggle.appendChild(label);
   toggle.addEventListener('click',function(){setEnabled(!pref);});
  }
  if(toggle.parentNode!==target)target.appendChild(toggle);
  toggle.setAttribute('aria-pressed',String(active()));
  toggle.disabled=!v21();
  if(toggle.disabled) toggle.title='Cần bật PC V21 trước để bật V22';
  else toggle.title='Bật/tắt giao diện PC V22 (Alt+Shift+O)';
 }
 function apply(){
  if(!document.body)return;
  var body=document.body,on=active();
  if(body.classList.contains('vli-pc-ui-v22')!==on)body.classList.toggle('vli-pc-ui-v22',on);
  var classic=on&&layout==='classic',hideDock=on&&!dockVisible;
  if(body.classList.contains('vli-pc-ui-v22-classic')!==classic)body.classList.toggle('vli-pc-ui-v22-classic',classic);
  if(body.classList.contains('vli-pc-ui-v22-hide-dock')!==hideDock)body.classList.toggle('vli-pc-ui-v22-hide-dock',hideDock);
  if(playing()){
    createToggle();
    if(on)skinRealButtons();
  }
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;apply();});}
 function setEnabled(x){pref=!!x;storageSet(KEY,pref?'1':'0');schedule();return pref;}
 function setLayout(x){if(x!=='classic'&&x!=='adaptive')throw new Error('Layout must be classic or adaptive');
  layout=x;storageSet(LAYOUT_KEY,layout);schedule();return layout;}
 function setDock(x){dockVisible=!!x;storageSet(DOCK_KEY,dockVisible?'1':'0');schedule();return dockVisible;}
 function state(){
  var body=document.body;
  return {
   version:VERSION,source:['Ui.pak','spr.pak'],base:'V21',
   enabled:!!body&&body.classList.contains('vli-pc-ui-v22'),preference:pref,
   desktop:desktop(),gameDetected:!!body&&playing(),v21Enabled:v21(),
   layout:layout,dockVisible:dockVisible,
   genuinePcAssets:23,referencedUiAssets:75,
   liveDockButtons:document.querySelectorAll('#v21-dock button').length,
   nativeButtonInstances:document.querySelectorAll('#v21-dock button,button.v21-native-button,button.pcui-native-button,button.v22-skin-button').length,
   pcWindowOpen:!!body&&body.classList.contains('u20win'),
   windowName:body?body.getAttribute('data-u2t'):null,
   gameplayModified:false,characterSaveModified:false,
   verifiedPixelPerfect:false,
   note:'Trạng thái DOM; không chứng nhận giống PC 100% nếu chưa so ảnh và chạy thử game gốc.'
  };
 }
 function auditAssets(){return Promise.all(assets.map(function(filename){
  return new Promise(function(done){var im=new Image();
   im.onload=function(){done({file:filename,loaded:true,width:im.naturalWidth,height:im.naturalHeight});};
   im.onerror=function(){done({file:filename,loaded:false});};
   im.src=ROOT+filename;
  });
 }));}
 function coords(){
  var ids=['hud','v8left','v8right','v8mapframe','v8maptitle','v8bar','pad','panel','v21-dock','u20lines','v22-toggle'];
  return ids.map(function(id){var e=el(id);if(!e)return {id:id,found:false};
   var r=e.getBoundingClientRect();return {id:id,found:true,visible:!!(r.width&&r.height),
    left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)};
  });
 }
 function statusReport(){var info=state();info.positions=coords();return info;}
 function initialize(){
  if(ready||!document.body)return;ready=true;
  apply();
  if(window.MutationObserver){watcher=new MutationObserver(schedule);
   watcher.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-u2t']});}
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('keydown',function(e){
   if(!e.altKey||!e.shiftKey||e.ctrlKey||e.metaKey||e.repeat)return;
   var k=String(e.key).toLowerCase();
   if(k==='o'){e.preventDefault();setEnabled(!pref);}
   if(k==='l'){e.preventDefault();setLayout(layout==='classic'?'adaptive':'classic');}
   if(k==='m'){e.preventDefault();setDock(!dockVisible);}
  });
 }
 window.VLI_PC_UI_V22={version:VERSION,status:state,inspectLayout:statusReport,
  auditAssets:auditAssets,enable:function(){return setEnabled(true);},
  disable:function(){return setEnabled(false);},toggle:function(){return setEnabled(!pref);},
  setLayout:setLayout,setDock:setDock};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();
