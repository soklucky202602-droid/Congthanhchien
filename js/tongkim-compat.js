/* Compatibility support for the independent Tong Kim canvas layer. */
'use strict';
function nameTag(x,y,text,color='#f0e2c0',size=11){
  if(typeof CX==='undefined')return;
  CX.save();
  CX.font=`bold ${Math.max(9,Math.min(18,size))}px sans-serif`;
  CX.textAlign='center';CX.textBaseline='middle';
  CX.lineWidth=3;CX.strokeStyle='#080d0c';
  CX.strokeText(String(text),x,y);CX.fillStyle=color;
  CX.fillText(String(text),x,y);CX.restore();
}
function bar(x,y,w,h,fraction,color='#2ed573'){
  if(typeof CX==='undefined')return;
  CX.save();CX.fillStyle='#170f0ee8';CX.fillRect(x,y,w,h);
  CX.fillStyle=color;CX.fillRect(x+1,y+1,Math.max(0,w-2)*Math.max(0,Math.min(1,Number(fraction)||0)),Math.max(1,h-2));
  CX.strokeStyle='#dfd2ae99';CX.lineWidth=.75;CX.strokeRect(x,y,w,h);CX.restore();
}
/* Keep the offline character's stored gold/XP/skills; battles use local bots. */
function vliTkOpen(){
  if(typeof S==='undefined'||!S||!S.fac){if(typeof toast==='function')toast('Hãy tạo nhân vật trước.');return;}
  if(typeof TK!=='undefined'&&TK.on){if(typeof toast==='function')toast('Bạn đang ở chiến trường.');return;}
  if(typeof tkOpenModal==='function'){
    tkOpenModal();
    const body=document.getElementById('mBody');
    if(body){
      body.innerHTML=body.innerHTML.replace('quy đổi trang bị quý','đổi kinh nghiệm hoặc ngân lượng');
      const btn=document.createElement('button');btn.className='btn';
      btn.textContent='🏅 Đổi Chiến Tích';
      btn.style.marginTop='9px';
      btn.addEventListener('click',vliTkShop);
      body.appendChild(btn);
    }
  }
}
function vliTkShop(){
  if(!S||!S.fac)return;
  const n=Math.max(0,Math.floor(S.tkTokens||0));
  modal('<h3>🏅 Đổi thưởng Chiến Tích Tống Kim (Offline)</h3>'+
    '<p class="desc">Hiện có <b>'+n+'</b> điểm Chiến Tích. Điểm lưu riêng trong nhân vật trên máy.</p>'+
    '<div class="btnrow"><button class="btn" id="tkGold" '+(n<100?'disabled':'')+'>100 điểm → 50.000 lượng</button>'+
    '<button class="btn" id="tkXp" '+(n<200?'disabled':'')+'>200 điểm → EXP</button>'+
    '<button class="btn" id="tkBack">Quay lại</button></div>',()=>{
      document.getElementById('tkGold').onclick=()=>vliTkExchange(100,'gold');
      document.getElementById('tkXp').onclick=()=>vliTkExchange(200,'xp');
      document.getElementById('tkBack').onclick=vliTkOpen;
    });
}
function vliTkExchange(cost,type){
  if(!S||!S.fac||!Number.isFinite(S.tkTokens)||S.tkTokens<cost){toast('Không đủ điểm Chiến Tích.');return;}
  S.tkTokens-=cost;
  if(type==='gold'){S.gold+=50000;toast('Nhận 50.000 lượng!');}
  else {const xp=Math.max(10,Math.round(expFor(S.lvl)*.12));gainXp(xp);toast('Nhận '+fmt(xp)+' EXP!');}
  save();vliTkShop();
}
(function(){
  const button=document.getElementById('tkBtn');
  if(button)button.addEventListener('click',vliTkOpen);
})();
