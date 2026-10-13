/* VLI PC UI V21.0 - additive desktop presentation for the existing H5 interface.
 * Reuses original Ui.pak imagery. Never duplicates inventory/skill controls,
 * changes game objects, calls save(), modifies combat, or touches character data.
 */
(function () {
  'use strict';
  if (window.VLI_PC_UI_V21) return;
  var VERSION = '21.0';
  var KEY = 'VLI_PC_UI_V21_ENABLED'; // dedicated UI preference only
  var ROOT = 'ui/pc-v21/';
  var activePref = true;
  var ready = false, scheduled = false, observer = null;
  var buttons = {
    'Trang bị':['equip',74,26,3], 'Chuyển':['transfer',67,19,4],
    'Lập nhóm':['make-party',93,26,2], 'Rút tiền':['withdraw',74,26,3],
    'Gửi tiền':['deposit',74,26,3], 'Gửi Tiền':['deposit',74,26,3],
    'Mời nhóm':['invite',67,19,4], 'Hủy bỏ':['cancel',67,19,3],
    'Xác nhận':['confirm',67,19,3], 'Mở Rương':['open-chest',52,15,3],
    'Rời nhóm':['leave-party',67,19,4], 'Giải tán':['disband',67,19,3],
    'Khóa':['lock',52,15,4], 'Trục xuất':['remove',67,19,4],
    'Cập nhật':['update',67,19,4], 'Mật Mã':['password',52,15,3]
  };
  try { activePref=localStorage.getItem(KEY)!=='0'; } catch (_) {}
  var desktop = function () {return window.innerWidth>=900 && window.innerHeight>=560 && window.innerWidth>window.innerHeight;};
  var el = function(id){return document.getElementById(id);};
  function playing(){return !!document.querySelector('#battle') && !!document.querySelector('#panel');}
  function live(){return !!(activePref && desktop() && playing() && document.body.classList.contains('u20'));}
  function skinButtons(){
    document.querySelectorAll('#panel button,#modal button').forEach(function(b){
      if(!b.isConnected || b.classList.contains('pcui-native-button')) return;
      var label=(b.textContent||'').replace(/\s+/g,' ').trim();
      var spec=buttons[label];
      if(!spec || b.dataset.v21Native===spec[0]) return;
      b.dataset.v21Native=spec[0];
      if(!b.title) b.title=label;
      if(!b.hasAttribute('aria-label')) b.setAttribute('aria-label',label);
      var props={'--v21-bnormal':'url("'+ROOT+spec[0]+'-0.webp")',
                 '--v21-bhover':'url("'+ROOT+spec[0]+'-'+Math.min(1,spec[3]-1)+'.webp")',
                 '--v21-bactive':'url("'+ROOT+spec[0]+'-'+Math.min(2,spec[3]-1)+'.webp")',
                 '--v21-bw':spec[1]+'px','--v21-bh':spec[2]+'px'};
      Object.keys(props).forEach(function(k){b.style.setProperty(k,props[k]);});
      b.classList.add('v21-native-button');
    });
  }
  var actions=[['char','Nhân vật','Nhân'],['inv','Hành trang','Túi'],['skill','Võ công','Võ'],['forge','Lò rèn','Rèn'],['quest','Nhiệm vụ','N.vụ'],['more','Hệ thống','Hệ']];
  function launch(tab){
    var original=document.querySelector('#u20menu .u20mi[data-u="'+tab+'"]');
    if(original){original.click();return true;}
    if(typeof window.u20Open==='function'){window.u20Open(tab);return true;}
    return false;
  }
  function ensureDock(){
    if(!playing())return;
    var dock=el('v21-dock');
    if(!dock){
      dock=document.createElement('nav'); dock.id='v21-dock';
      dock.setAttribute('aria-label','Thanh mở cửa sổ Võ Lâm PC');
      actions.forEach(function(a){
        var b=document.createElement('button');b.type='button';b.dataset.v21Tab=a[0];
        b.title=a[1];b.setAttribute('aria-label',a[1]);
        var img=document.createElement('img');img.src='img/u2/'+a[0]+'.png';img.alt='';img.setAttribute('aria-hidden','true');
        var label=document.createElement('span');label.textContent=a[2];
        b.appendChild(img);b.appendChild(label);
        b.addEventListener('click',function(){launch(a[0]);});
        dock.appendChild(b);
      });
      document.body.appendChild(dock);
    }
    var tab=document.body.getAttribute('data-u2t')||'';
    dock.querySelectorAll('button').forEach(function(b){
      var open=document.body.classList.contains('u20win') && b.dataset.v21Tab===tab;
      if(b.getAttribute('aria-pressed')!==String(open))b.setAttribute('aria-pressed',String(open));
    });
    var toggle=el('v21-toggle');
    var host=document.querySelector('#v8left .v8actions')||el('top');
    if(!toggle && host){
      toggle=document.createElement('button');toggle.type='button';toggle.id='v21-toggle';toggle.className='v8action';
      toggle.title='Bật/tắt giao diện PC V21 (Alt+Shift+P)';
      toggle.setAttribute('aria-label','Bật/tắt giao diện PC V21');
      toggle.innerHTML='<span class="v8ico" aria-hidden="true">▣</span><span>PC V21</span>';
      toggle.addEventListener('click',function(){setEnabled(!activePref);});
    }
    if(toggle && host && toggle.parentNode!==host) host.appendChild(toggle);
    if(toggle)toggle.setAttribute('aria-pressed',String(live()));
  }
  function apply(){
    if(!document.body)return;
    var on=live();
    if(document.body.classList.contains('vli-pc-ui-v21')!==on)document.body.classList.toggle('vli-pc-ui-v21',on);
    if(playing()){
      ensureDock();
      if(on)skinButtons();
    }
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;apply();});}
  function setEnabled(on){
    activePref=!!on;
    try{localStorage.setItem(KEY,activePref?'1':'0');}catch (_){}
    schedule();return activePref;
  }
  function status(){
    var body=document.body;
    return {version:VERSION,source:'Ui.pak',enabled:!!body&&body.classList.contains('vli-pc-ui-v21'),
      preference:activePref,desktop:desktop(),windowOpen:!!body&&body.classList.contains('u20win'),
      activeTab:body?body.getAttribute('data-u2t'):null,
      nativeImagesIncluded:75,quickWindowButtons:document.querySelectorAll('#v21-dock button').length,
      pcButtonInstances:document.querySelectorAll('button.v21-native-button,button.pcui-native-button').length,
      characterSaveChangedByPatch:false,combatModifiedByPatch:false,
      note:'Runtime state only; visual fidelity requires comparison with PC screenshots.'};
  }
  function auditAssets(){
    return Promise.all(['native-pc-frame-v21.webp','native-pc-slot-v21.webp',
      'native-pc-inventory.webp','native-pc-close-0.webp','native-pc-health-red.webp',
      'native-pc-health-blue.webp','equip-0.webp'].map(function(f){
      return new Promise(function(resolve){
        var im=new Image();im.onload=function(){resolve({file:f,loaded:true,width:im.naturalWidth,height:im.naturalHeight});};
        im.onerror=function(){resolve({file:f,loaded:false});};im.src=ROOT+f;
      });
    }));
  }
  function boot(){
    if(ready || !document.body)return;ready=true;
    apply();
    if(window.MutationObserver){
      observer=new MutationObserver(schedule);
      observer.observe(document.body,{attributes:true,attributeFilter:['class','data-u2t'],childList:true,subtree:true});
    }
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('keydown',function(e){
      if(e.altKey && e.shiftKey && String(e.key).toLowerCase()==='p'){
        e.preventDefault();setEnabled(!activePref);
      }
    });
  }
  window.VLI_PC_UI_V21={version:VERSION,status:status,enable:function(){return setEnabled(true);},
    disable:function(){return setEnabled(false);},toggle:function(){return setEnabled(!activePref);},
    auditAssets:auditAssets,openWindow:launch};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
