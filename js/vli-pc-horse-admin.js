/* VLI V15 PC horse catalogue: 42/43 verified riding sets; 39 original PC icons. */
(function(){
 'use strict';
 const css=`#vli-pc-horse-open{background:#165953;border:1px solid #64bca7;color:#ecfff8;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer}#vli-pc-horse-open:hover{background:#1a756e}
 #vli-pc-horse-ui{color:#f3f8ef}#vli-pc-horse-ui .vli-pc-tools{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}#vli-pc-horse-ui select,#vli-pc-horse-ui input{min-height:30px;background:#1c2725;color:#fff;border:1px solid #537368;padding:4px;border-radius:4px}#vli-pc-horse-ui button{cursor:pointer;padding:5px 9px;border-radius:4px;border:1px solid #638c7c;background:#224138;color:#fff}#vli-pc-horse-ui .vli-pc-grant{background:#116f5a;border-color:#65baa2}
 #vli-pc-horse-ui .vli-pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:7px;max-height:42vh;overflow:auto}#vli-pc-horse-ui .vli-pc-card{display:flex;align-items:center;gap:8px;text-align:left;min-height:56px;font-size:12px}#vli-pc-horse-ui .vli-pc-card.active{border-color:#d6ad46;background:#475024}#vli-pc-horse-ui .vli-pc-card img{width:40px;height:40px;object-fit:contain}#vli-pc-horse-ui .vli-pc-meta{color:#bed7d2;font-size:12px;margin:8px 0}#vli-pc-horse-ui .vli-pc-warning{color:#ffc579}#vli-pc-horse-ui .vli-pc-footer{display:flex;align-items:center;gap:10px;margin:10px 0}#vli-pc-horse-ui .vli-pc-footer img{width:60px;height:60px;object-fit:contain}`;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 const models=window.VLI_PC_HORSE_MODELS||[];
 let selected=models.length?models[0].k:-1,level=10,query='';
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function root(){return document.getElementById('vli-pc-horse-ui');}
 function row(){return window.JX?.items?.[10]?.list?.find(i=>i.k===selected&&i.lvl===level);}
 function grant(){
   if(typeof NET_LOCAL!=='undefined'&&!NET_LOCAL){if(typeof toast==='function')toast('Chỉ hỗ trợ game offline');return;}
   if(typeof S==='undefined'||!S||!S.fac){if(typeof toast==='function')toast('Hãy tạo nhân vật trước');return;}
   if(!Array.isArray(S.inv)||S.inv.length>=(typeof INV_MAX==='number'?INV_MAX:100)){if(typeof toast==='function')toast('Hành trang đầy');return;}
   if(typeof makeItem!=='function'){if(typeof toast==='function')toast('Chưa tải xong hệ thống vật phẩm');return;}
   const it=makeItem(10,selected,level,0,5),ref=row();
   if(!it||!ref||it.k!==ref.k||it.n!==ref.n){if(typeof toast==='function')toast('Dữ liệu ngựa chưa hợp lệ');return;}
   it.lock=true;it.vliPcHorse=1;
   S.inv.unshift(it);
   try{if(typeof invDirty!=='undefined')invDirty=true;if(typeof R!=='undefined'&&R)R.dirty=true;
     if(typeof recalc==='function')recalc();if(typeof save==='function')save();if(typeof refresh==='function')refresh();
     if(typeof toast==='function')toast('Đã nhận: '+it.n+' (cấp yêu cầu '+((it.req.find(x=>x[0]===36)||[0,'?'])[1])+')');
   }catch(err){console.error('[VLI PC Horse] UI refresh',err);}
   show();
 }
 function show(){
   if(typeof modal!=='function')return;
   const filt=models.filter(m=>!query||m.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))||String(m.k)===query);
   const model=models.find(m=>m.k===selected)||models[0]; if(model&&level>model.source_levels)level=model.source_levels; const it=row();
   const cards=filt.map(m=>`<button type="button" class="vli-pc-card ${selected===m.k?'active':''}" data-k="${m.k}"><img src="${esc(m.icon)}" alt=""/><span><b>${esc(m.name)}</b><br><small>PC K${m.k} · ${m.source_levels} bậc · ${window.VLI_PC_HORSE_STATUS?.[m.k]?.ridingPC?'✓ ảnh cưỡi gốc':'thiếu ảnh cưỡi'}</small></span></button>`).join('');
   const st=model&&window.VLI_PC_HORSE_STATUS?.[model.k];
   const note=st&&st.ridingPC?'Đã có bộ hoạt ảnh cưỡi PC gốc (3 lớp, 8 hành động). '+(st.iconPC?'Icon nguyên bản PC.':'Icon PC chưa tìm thấy trong PAK; hiện dùng biểu tượng có sẵn.'):'Chưa tìm thấy đủ bộ hoạt ảnh cưỡi PC cho mẫu này. Không dùng sprite ngựa khác.';
   const desc=model&&it?`<div class="vli-pc-footer"><img src="${esc(model.icon)}" alt=""/><div><b>${esc(model.name)}</b><br><small>Bậc ${level} · Cấp yêu cầu ${(it.req.find(x=>x[0]===36)||[0,'?'])[1]} · Mã K${model.k}</small><br><small class="vli-pc-warning">${esc(note)}</small></div></div>`:'';
   const content=`<div id="vli-pc-horse-ui"><h3>🐎 Ngựa PC mới · ${models.length} loại</h3><p class="vli-pc-meta">Danh mục 43 loại từ bảng PC. Đã ánh xạ 42 bộ ảnh cưỡi nguyên bản và 39 icon PC; mẫu K33 vẫn thiếu ảnh cưỡi. Icon còn thiếu dùng hình sẵn có hoặc hình nhận diện tạm.</p><div class="vli-pc-tools"><input id="vli-pc-q" type="search" placeholder="Tìm tên ngựa, ví dụ Rồng Xanh" value="${esc(query)}"/><label>Bậc <select id="vli-pc-lv">${Array.from({length:model?model.source_levels:10},(_,i)=>`<option value="${i+1}" ${level===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label></div><div class="vli-pc-grid">${cards||'Không tìm thấy'}</div>${desc}<button class="vli-pc-grant" id="vli-pc-grant" ${it?'':'disabled'}>Tạo ngựa vào hành trang (Offline)</button> <button id="vli-pc-close">Đóng</button></div>`;
   modal(content,()=>{
     document.querySelectorAll('#vli-pc-horse-ui [data-k]').forEach(el=>el.addEventListener('click',()=>{selected=+el.dataset.k;show();}));
     const lv=document.getElementById('vli-pc-lv');if(lv)lv.onchange=()=>{level=+lv.value;show();};
     const q=document.getElementById('vli-pc-q');if(q)q.onchange=()=>{query=q.value.trim();show();};
     const g=document.getElementById('vli-pc-grant');if(g)g.onclick=grant;
     const close=document.getElementById('vli-pc-close');if(close)close.onclick=()=>typeof closeModal==='function'&&closeModal(true);
   });
 }
 function addButton(){if(document.getElementById('vli-pc-horse-open')||!models.length)return;
   const top=document.getElementById('top');if(!top)return;
   const b=document.createElement('button');b.type='button';b.id='vli-pc-horse-open';b.textContent='🐎 Ngựa PC +'+models.length;b.title='Danh sách ngựa mới từ client PC';b.onclick=show;
   const ref=document.getElementById('tkBtn');if(ref&&ref.parentElement===top)ref.insertAdjacentElement('afterend',b);else top.appendChild(b);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButton);else addButton();
 window.VLI_PC_HORSE_ADMIN={open:show,grant,models};
})();
