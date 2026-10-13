/* VLI V20 UI: original Pc Ui.pak button artwork + presentation layer only.
 * No gameplay data, save files, skill selection, auto combat or core event
 * handlers are changed. Toggle preference uses an isolated UI-only key. */
(function () {
  'use strict';
  if (window.VLI_PC_UI_V20) return;
  var VERSION = '20.0', KEY = 'VLI_PC_UI_V20_ON', ROOT = 'ui/pc-v20/';
  var nativeButtons = {
    'Trang bị':['equip',74,26,3], 'Chuyển':['transfer',67,19,4],
    'Lập nhóm':['make-party',93,26,2], 'Rút tiền':['withdraw',74,26,3],
    'Gửi tiền':['deposit',74,26,3], 'Gửi Tiền':['deposit',74,26,3],
    'Mời nhóm':['invite',67,19,4], 'Hủy bỏ':['cancel',67,19,3],
    'Cập nhật':['update',67,19,4], 'Trục xuất':['remove',67,19,4],
    'Giải tán':['disband',67,19,3], 'Rời nhóm':['leave-party',67,19,3],
    'Xác nhận':['confirm',67,19,3], 'Mở Rương':['open-chest',52,15,3],
    'Lời Rao':['advert',52,15,3], 'Rao Bán':['sell',52,15,3],
    'Khóa':['lock',52,15,4], 'Định Giá':['price',52,15,3],
    'Mật Mã':['password',52,15,3]
  };
  var safeRead = function () { try { return localStorage.getItem(KEY) !== '0'; } catch (_) { return true; } };
  var preference = safeRead(), initialized = false, frame = 0, decorated = 0;
  var desktop = function () { return window.innerWidth>=900 && window.innerHeight>=560 && window.innerWidth>window.innerHeight; };
  function assignButton(button) {
    if (!button || !button.isConnected || button.id==='vli-pc-ui-v20-toggle' || button.dataset.pcuiNativeV20==='off') return;
    var text = (button.textContent||'').replace(/\s+/g,' ').trim();
    var m = nativeButtons[text];
    if(!m || !button.closest('#panel,#modal')) {
      if (button.classList.contains('pcui-native-button')) button.classList.remove('pcui-native-button');
      return;
    }
    if (button.dataset.pcuiNativeV20===m[0]) return;
    button.dataset.pcuiNativeV20=m[0];
    if(!button.hasAttribute('aria-label')) button.setAttribute('aria-label', text);
    if(!button.title) button.title=text;
    var vars={ '--pcui-normal':'url("'+ROOT+m[0]+'-0.webp")',
      '--pcui-hover':'url("'+ROOT+m[0]+'-'+Math.min(1,m[3]-1)+'.webp")',
      '--pcui-active':'url("'+ROOT+m[0]+'-'+Math.min(2,m[3]-1)+'.webp")',
      '--pcui-w':m[1]+'px', '--pcui-h':m[2]+'px'};
    Object.keys(vars).forEach(function (k) { button.style.setProperty(k,vars[k]); });
    button.classList.add('pcui-native-button');decorated++;
  }
  function scanButtons() { document.querySelectorAll('#panel button,#modal button').forEach(assignButton); }
  function toggleUI(on) {
    preference=!!on;
    try {localStorage.setItem(KEY,preference?'1':'0');}catch (_){}
    applyUI(); return preference;
  }
  function applyUI() {
    var active=preference && desktop();
    document.body.classList.toggle('vli-pc-ui-v20',active);
    var toggle=document.getElementById('vli-pc-ui-v20-toggle');
    if(toggle){toggle.setAttribute('aria-pressed',String(active));toggle.title=active?'Tắt lớp giao diện PC (Alt+Shift+U)':'Bật giao diện PC (Alt+Shift+U)';}
    if(active) scanButtons();
  }
  function putToggle() {
    var target=document.querySelector('#v8left .v8actions') || document.getElementById('top');
    if(!target) return;
    var b=document.getElementById('vli-pc-ui-v20-toggle');
    if(!b){b=document.createElement('button');b.type='button';b.id='vli-pc-ui-v20-toggle';b.className='v8action';b.innerHTML='<span class="v8ico" aria-hidden="true">◈</span><span>UI PC</span>';
      b.addEventListener('click',function(){toggleUI(!preference);});}
    if(b.parentElement!==target){target.appendChild(b);}
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(function(){frame=0;putToggle();applyUI();});}
  function showGallery(){
    var prev=document.getElementById('vli-pc-ui-v20-gallery');if(prev){prev.remove();return;}
    var items=[['native-pc-inventory.webp','Túi hành trang PC'],['native-pc-items.webp','Vật phẩm PC'],['native-pc-chest.webp','Rương chứa đồ PC'],['native-pc-trade.webp','Giao dịch PC'],['native-pc-exchange.webp','Giao vật phẩm PC']];
    var v=document.createElement('div');v.id='vli-pc-ui-v20-gallery';v.setAttribute('role','dialog');v.setAttribute('aria-label','Các cửa sổ PC trích xuất từ Ui.pak');
    v.innerHTML='<div class="pcui-gallery-panel"><header><strong>Ảnh UI PC gốc – Ui.pak (chế độ đối chiếu)</strong><button type="button" id="pcui-gallery-close">Đóng</button></header><section class="pcui-gallery-items">'+items.map(function(a){return '<figure><img src="'+ROOT+a[0]+'" alt="'+a[1]+'"><figcaption>'+a[1]+'</figcaption></figure>'}).join('')+'</section><p style="margin-top:12px;color:#d5c49f">Ảnh tham chiếu chưa phải cửa sổ gameplay có thể thao tác. Các nút PC tương ứng được gắn vào cửa sổ thật khi khả dụng.</p></div>';
    document.body.appendChild(v);v.querySelector('#pcui-gallery-close').addEventListener('click',function(){v.remove();});
    v.addEventListener('click',function(e){if(e.target===v)v.remove();});
  }
  function status(){return {version:VERSION,source:'Ui.pak',enabled:document.body.classList.contains('vli-pc-ui-v20'),preference:preference,desktop:desktop(),knownAssets:30,exportedFiles:73,nativeButtonInstances:document.querySelectorAll('button.pcui-native-button').length,gameplayModified:false,saveModified:false};}
  function auditAssets(){var src=['native-pc-inventory.webp','native-pc-chest.webp','confirm-0.webp','native-pc-close-0.webp'];
    return Promise.all(src.map(function(file){return new Promise(function(resolve){var im=new Image();im.onload=function(){resolve({file:file,ok:true,width:im.naturalWidth,height:im.naturalHeight});};im.onerror=function(){resolve({file:file,ok:false});};im.src=ROOT+file;});}));}
  function boot() {
    if(initialized)return;initialized=true;putToggle();applyUI();
    // Watch inserted game windows without interfering with their event listeners.
    if(window.MutationObserver){new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});}
    window.addEventListener('resize',schedule);
    window.addEventListener('keydown',function(e){if(e.altKey&&e.shiftKey&&String(e.key).toLowerCase()==='u'){e.preventDefault();toggleUI(!preference);}});
  }
  window.VLI_PC_UI_V20={version:VERSION,source:'Ui.pak',status:status,enable:function(){return toggleUI(true);},disable:function(){return toggleUI(false);},toggle:function(){return toggleUI(!preference);},showGallery:showGallery,auditAssets:auditAssets};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
