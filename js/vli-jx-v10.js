/* VLI V10 - UI recovery + display-only map backgrounds for Tower and Tong Kim.
 * Builds on V8/V9 without changing combat, Auto, skill, character data, save or audio engine.
 */
(function () {
  'use strict';
  if (window.__VLI_JX_V10__) return;
  window.__VLI_JX_V10__ = true;

  var byId = function (id) { return document.getElementById(id); };
  var state = { tkOn: false, tkOldBg: null, tkImage: null, patchedMini: false };
  var TK_IMG = 'ui/vli-v10/tongkim.jpg';
  var towerImg = 'img/z/397.jpg';
  var timer = null;

  function v10Enabled() {
    return document.body && document.body.classList.contains('v8-jx') && document.body.classList.contains('u20');
  }
  function gameReady() {
    return typeof S !== 'undefined' && !!S && !!S.fac && typeof R !== 'undefined' && !!R;
  }
  function isTkActive() { return typeof TK !== 'undefined' && !!TK && TK.on === true; }
  function isTowerActive() { return gameReady() && !!R.tower; }
  function image(path) {
    if (typeof img === 'function') return img(path);
    if (!state.tkImage) {state.tkImage = new Image();state.tkImage.src = path;}
    return state.tkImage;
  }

  function makeGear(side) {
    var b = document.createElement('button');
    b.type='button'; b.dataset.v8act='more'; b.title='Hệ thống: lưu/tải game, âm thanh, cài đặt';
    b.setAttribute('aria-label',b.title); b.dataset.v10System='1';
    if(side) {
      b.className='v8side v10-system';
      b.innerHTML='<i aria-hidden="true">⚙</i><span>Hệ thống</span>';
    } else {
      b.className='v8tile v10-system';
      b.innerHTML='<span class="v8tileico" style="background-image:url(ui/jx1/nav_more.png)" aria-hidden="true"></span><span class="v8mini">Hệ thống</span>';
    }
    return b;
  }
  function recoverSystemButtons() {
    // Use the existing V8 delegated click handler for [data-v8act="more"], which
    // calls the original u20Toggle('more') and renders real controls from ui.js.
    var right=byId('v8right');
    if(right && !right.querySelector('[data-v10-system]')) right.appendChild(makeGear(true));
    var bar=byId('v8bar');
    var wing=bar && bar.querySelector('.v8wing:last-child');
    if(wing && !wing.querySelector('[data-v10-system]')) {
      var after=wing.querySelector('[data-v8act="admin"]');
      var btn=makeGear(false);
      if(after)wing.insertBefore(btn,after);
      else wing.appendChild(btn);
    }
  }

  function patchMinimap() {
    if(state.patchedMini || typeof drawMinimap !== 'function' || typeof MINI === 'undefined')return;
    var original=drawMinimap;
    drawMinimap=function () {
      if (v10Enabled() && !isTkActive()) {
        // Match V9's upper-right frame (a 142 x 132 rectangle).
        MINI.s=128; MINI.top=55; MINI.m=16;
      }
      return original.apply(this,arguments);
    };
    state.patchedMini=true;
  }
  function syncTkBackground() {
    if (!gameReady())return;
    var active=isTkActive();
    if(active) {
      if(!state.tkOn){state.tkOldBg=R.bgImg||null;state.tkOn=true;}
      var bg=image(TK_IMG);
      if(bg && R.bgImg!==bg)R.bgImg=bg;
    } else if(state.tkOn) {
      var expected=image(TK_IMG);
      // Restore the background in effect before joining the battlefield.
      // If the game already switched maps, do not overwrite its new background.
      if(R.bgImg===expected) {
        if(isTowerActive())R.bgImg=image(towerImg);
        else R.bgImg=state.tkOldBg || (typeof zoneOf==='function' && typeof STAGES!=='undefined' ? image(zoneOf(Math.min(S.stage,STAGES)).bg) : null);
      }
      state.tkOldBg=null;state.tkOn=false;
    }
  }

  function recoverMissingTowerBackground() {
    if(!gameReady() || !isTowerActive() || isTkActive())return;
    if(R.bgImg && !R.bgImg.complete)return;
    var src=R.bgImg && R.bgImg.src || '';
    // Only recover a genuinely unavailable background; don't replace a valid asset.
    if(!R.bgImg || !R.bgImg.naturalWidth) {
      if(!src || /(?:\/|^)397\.jpg(?:$|\?)/.test(src))R.bgImg=image(towerImg);
    }
  }

  function minimapCanvas() {
    var host=byId('v8mapframe');if(!host)return null;
    var canvas=byId('v10tkmini');
    if(!canvas){canvas=document.createElement('canvas');canvas.id='v10tkmini';canvas.width=272;canvas.height=248;canvas.setAttribute('aria-label','Bản đồ chiến trường Tống Kim');host.appendChild(canvas);}
    return canvas;
  }
  function dot(ctx,x,y,r,col){ctx.beginPath();ctx.fillStyle=col;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#111b12';ctx.lineWidth=2;ctx.stroke();}
  function drawTkMini(){
    var canvas=minimapCanvas();
    if(!canvas || !isTkActive() || !v10Enabled())return;
    var c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    c.clearRect(0,0,w,h); c.fillStyle='#1d2a20';c.fillRect(0,0,w,h);
    var bg=image(TK_IMG);
    if(bg && bg.complete && bg.naturalWidth>0){
      try{c.drawImage(bg,0,0,w,h);}catch(e){}
    }
    c.fillStyle='rgba(4,8,5,.10)';c.fillRect(0,0,w,h);
    var mx=(typeof TK_MAP_W === 'number' && TK_MAP_W>0)?TK_MAP_W:1600;
    var my=(typeof TK_MAP_H === 'number' && TK_MAP_H>0)?TK_MAP_H:1000;
    function at(x,y){return [Math.max(2,Math.min(w-2,x/mx*w)),Math.max(2,Math.min(h-2,y/my*h))];}
    var a=at(120,my/2),b=at(mx-120,my/2);
    dot(c,a[0],a[1],5,'#71d783');dot(c,b[0],b[1],5,'#e68f67');
    if(TK.ents && Array.isArray(TK.ents)){
      TK.ents.forEach(function(ent){
        if(!ent || ent.dead || !Number.isFinite(ent.x) || !Number.isFinite(ent.y))return;
        var p=at(ent.x,ent.y);
        dot(c,p[0],p[1],2,ent.side==='song'?'#6be39d':'#ef6c63');
      });
    }
    if(typeof H!=='undefined' && H && Number.isFinite(H.x)&&Number.isFinite(H.y)){
      var p=at(H.x,H.y);
      dot(c,p[0],p[1],6,'#ffe69a');
      c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(p[0]-7,p[1]-7,14,14);
    }
    c.strokeStyle='#d6ba7b';c.lineWidth=3;c.strokeRect(2,2,w-4,h-4);
  }

  function updateDisplay() {
    if(!document.body)return;
    var active=v10Enabled();
    document.body.classList.toggle('v10-tk',active && isTkActive());
    document.body.classList.toggle('v10-tower',active && isTowerActive() && !isTkActive());
    if(active) {
      recoverSystemButtons();
      patchMinimap();
      if(isTkActive())drawTkMini();
    }
    syncTkBackground();
    recoverMissingTowerBackground();
  }
  function boot() {
    if(!byId('app') || !byId('battle'))return;
    updateDisplay();
    timer=setInterval(updateDisplay,200);
    window.addEventListener('resize',updateDisplay,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
