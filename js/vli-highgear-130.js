/* Võ Lâm Idle offline - JXWEB high-level equipment catalogue (character level 130+).
 * Uses the source catalogue already shipped with the game's JX data.
 * Does not fetch from the internet or modify a remote character.
 */
'use strict';
(function(){
  const baseEntries=Array.isArray(window.VLI_GEAR130_CATALOG)?window.VLI_GEAR130_CATALOG:[];
  const state={kind:'gold',level:'all',school:'mine',q:'',page:0,selected:null};
  const kindNames={gold:'Hoàng Kim',platina:'Bạch Kim',horse:'Ngựa'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const req=(row,key)=>(Array.isArray(row.req)?row.req:[]).find(x=>Array.isArray(x)&&x[0]===key)?.[1]??-1;
  const isOffline=()=>typeof NET_LOCAL!=='undefined'&&NET_LOCAL===true;
  const hasHero=()=>typeof S!=='undefined'&&!!S&&!!S.fac&&typeof FAC!=='undefined'&&!!FAC[S.fac];
  const facId=()=>hasHero()?Number(FAC[S.fac].id):-1;
  const rawRows=kind=>{if(typeof J==='undefined'||!J)return [];return kind==='horse'?(J.items?.[10]?.list||[]):J.sets?.[kind]||[];};

  // V12 HORSE EXPANSION: game-owned horse rows, not speculative video-derived items.
  // All catalogue rows are validated against J.items[10].list, and duplicate legacy
  // subtypes 30/31/32 are excluded because horseOrig() rewrites them on loading.
  const qualityNames=['Thường','Tốt','Quý','Thần','Danh mã','Bảo mã','Chí tôn'];
  const qualityByKind={5:3,14:3,15:3,17:3,22:3,23:3,24:3,25:3,6:4,8:4,9:5,11:5,13:5,7:6,16:6,18:6,19:6,20:6,21:6,26:6,27:6,28:6,29:6};
  const horseQuality=row=>row.k<=4?(row.lvl<=4?0:row.lvl<=8?1:2):(qualityByKind[row.k]??-1);
  const horseRows=rawRows('horse');
  const horseEntries=horseRows.map((row,index)=>{
    if(!row||row.k>=30||!Number.isInteger(row.k)||!Number.isInteger(row.lvl)||
       !Array.isArray(row.base)||!Array.isArray(row.req))return null;
    return {id:'stable:'+index,kind:'horse',rowIndex:index,vliBuiltinHorse:1,
      requiredLevel:Math.max(1,Number(req(row,36))||1),schoolId:-1,
      name:row.n,icon:row.ic||'',group:null,detail:10,subtype:row.k,
      tier:row.lvl,quality:horseQuality(row),source:'V12 game horse table'};
  }).filter(Boolean);
  const entries=baseEntries.filter(row=>row.kind!=='horse').concat(horseEntries);
  const corresponding=(e)=>{
    if(!e||!kindNames[e.kind])return null;
    return rawRows(e.kind).find(r=>r.n===e.name&&Number(r.lvl)===Number(e.tier)&&
      (e.kind==='horse'?(r.k===e.subtype&&r.p===Number(e.id.split(':')[1])%330):
       (r.grp===e.group&&r.d===e.detail&&r.k===e.subtype))&&req(r,36)===e.requiredLevel)||null;
  };
  // Horses have positional names and may share a tier/subtype. Match by their
  // original row index when possible; fall back to the full stable row identity.
  const match=(e)=>{
    if(e.kind!=='horse')return corresponding(e);
    if(e.vliBuiltinHorse){
      const row=horseRows[e.rowIndex];
      return row&&row.n===e.name&&row.k===e.subtype&&row.lvl===e.tier&&
        Math.max(1,Number(req(row,36))||1)===e.requiredLevel?row:null;
    }
    const rows=rawRows('horse'),i=Number(e.id.split(':')[1]);
    let r=rows[i];
    if(r&&r.n===e.name&&r.lvl===e.tier&&r.k===e.subtype&&req(r,36)===e.requiredLevel)return r;
    return rows.find(r=>r.n===e.name&&r.lvl===e.tier&&r.k===e.subtype&&req(r,36)===e.requiredLevel)||null;
  };
  const hasAllAffixes=(r)=>Array.isArray(r.mag)&&r.mag.length>0&&r.mag.every(x=>J.ge[x])&&
      (r.ext||[]).every(x=>J.ge[x]);
  const ready=(e)=>{
    const r=match(e);if(!r)return false;
    if(e.kind==='horse')return Array.isArray(r.base)&&Array.isArray(r.req);
    return hasAllAffixes(r)&&typeof eqBanned==='function'&&!eqBanned({n:r.n,set:{kind:e.kind}});
  };
  const permitted=(e)=>isOffline()&&hasHero()&&Number(S.lvl)>=e.requiredLevel;
  const sourceForItem=it=>{
    if(!it||it.vliHigh130!==1)return null;
    const kind=it.d===10&&!it.set?'horse':it.set?.kind;
    if(!kindNames[kind])return null;
    const candidates=entries.filter(e=>e.kind===kind&&e.tier===it.lvl&&
      (e.name===it.n||(kind==='platina'&&!e.name.startsWith('[')&&it.n==='[Bạch Kim] '+e.name)));
    return candidates.find(e=>{
      const r=match(e);if(!r||(kind!=='horse'&&req(r,36)<130))return false;
      if(it.d!==10&&!it.set)return false;
      if(it.d===10&&it.set)return false;
      if(e.kind!=='horse'&&(it.set.grp!==r.grp||it.r!==(e.kind==='gold'?4:5)))return false;
      if(it.d!==(e.kind==='horse'?10:r.d)||it.k!==r.k||it.s!==r.s)return false;
      if(!Array.isArray(it.req)||!r.req.every(([k,v])=>it.req.some(x=>x[0]===k&&x[1]===v)))return false;
      if(e.kind==='horse')return it.p===r.p && it.ic===r.ic &&
        Array.isArray(it.base)&&it.base.length===r.base.length&&
        it.base.every((vals,i)=>Array.isArray(vals)&&vals.length===r.base[i].length&&
          vals.every((value,j)=>value===r.base[i][j]));
      if(!hasAllAffixes(r)||!Array.isArray(it.mag)||it.mag.length!==r.mag.length)return false;
      const norm=x=>x===65?66:x===70?71:x;
      return r.mag.every((id,i)=>it.mag[i]&&norm(it.mag[i].a)===norm(J.ge[id].a)&&Array.isArray(it.mag[i].p));
    })||null;
  };
  window.VLI_HIGHGEAR_OK=it=>!!sourceForItem(it);
  const make=(e,admin=false)=>{
    if(!ready(e)||(!admin&&!permitted(e)))return null;
    const r=match(e);let it;
    if(e.kind==='horse'){
      it={uid:S.uid++,d:10,k:r.k,p:r.p,n:r.n,ic:r.ic||'',lvl:r.lvl,s:r.s,
        price:r.price,base:r.base.map(a=>a.slice()),req:r.req.map(a=>a.slice()),mag:[],ext:[],r:0};
    }else if(typeof makeSetItem==='function')it=makeSetItem(e.kind,r,6);
    if(!it)return null;
    it.vliHigh130=1;
    if(admin)it.vliAdmin130=1;
    it.lock=true;
    if(!window.VLI_HIGHGEAR_OK(it))return null;
    return it;
  };
  function grantById(id,fromDrop=false,admin=false){
    const e=entries.find(x=>x.id===id);
    if(!e||!isOffline()||!hasHero()||!ready(e))return false;
    if(!admin&&!permitted(e)){typeof toast==='function'&&toast('Cần đạt cấp '+e.requiredLevel+' để nhận vật phẩm này.');return false;}
    if(!Array.isArray(S.inv)||S.inv.length>=(typeof INV_MAX==='number'?INV_MAX:100)){
      typeof toast==='function'&&toast('Hành trang đã đầy.');return false;
    }
    const oldUid=S.uid;const item=make(e,admin);
    if(!item){S.uid=oldUid;return false;}
    if(typeof eqBanned==='function'&&eqBanned(item)){S.uid=oldUid;return false;}
    if(typeof eqRemoved==='function'&&eqRemoved(item)){S.uid=oldUid;return false;}
    S.inv.unshift(item);
    if(typeof invDirty!=='undefined')invDirty=true;
    if(typeof recalc==='function')recalc();
    if(typeof refresh==='function')refresh();
    if(typeof save==='function')save();
    if(typeof toast==='function')toast((fromDrop?'Nhặt được: ':'Đã nhận: ')+item.n);
    return item;
  }
  function adminGrantBatch(ids){
    // Transaction: verify every item from the packaged JX table before commit.
    if(!isOffline()||!hasHero())return {ok:false,error:'Offline character required'};
    if(!Array.isArray(ids)||ids.length<1||ids.length>30||new Set(ids).size!==ids.length)
      return {ok:false,error:'Invalid list of item IDs'};
    const rows=ids.map(id=>entries.find(e=>e.id===id));
    if(rows.some(e=>!e||!ready(e)))return {ok:false,error:'Source item is incomplete'};
    if(!Array.isArray(S.inv)||S.inv.length+ids.length>(typeof INV_MAX==='number'?INV_MAX:100))
      return {ok:false,error:'Not enough inventory slots'};
    const oldUid=S.uid,created=[];
    for(const e of rows){
      const item=make(e,true);
      if(!item||!window.VLI_HIGHGEAR_OK(item)||
         (typeof eqBanned==='function'&&eqBanned(item))||
         (typeof eqRemoved==='function'&&eqRemoved(item))){
        S.uid=oldUid;return {ok:false,error:'Rejected item '+e.id};
      }
      created.push(item);
    }
    S.inv.unshift(...created);
    if(typeof invDirty!=='undefined')invDirty=true;
    if(typeof R!=='undefined'&&R)R.dirty=true;
    if(typeof recalc==='function')recalc();
    if(typeof refresh==='function')refresh();
    if(typeof save==='function')save();
    return {ok:true,items:created};
  }
  const catalogue=()=>{
    const q=state.q.toLocaleLowerCase('vi').trim(),id=facId();
    return entries.filter(e=>e.kind===state.kind &&
      (state.level==='all'||e.requiredLevel===Number(state.level)) &&
      (state.school==='all'||state.school==='mine'&&(e.schoolId<0||e.schoolId===id)||
       state.school!=='mine'&&e.schoolId===Number(state.school)) &&
      (!q||e.name.toLocaleLowerCase('vi').includes(q)));
  };
  function open(){
    if(typeof modal!=='function')return;
    const rows=catalogue(),max=Math.max(0,Math.ceil(rows.length/30)-1);
    state.page=Math.max(0,Math.min(max,state.page));
    if(!rows.some(e=>e.id===state.selected))state.selected=rows[0]?.id||null;
    const cur=entries.find(e=>e.id===state.selected),row=cur&&match(cur);
    const supported=cur&&ready(cur),limited=cur&&(!permitted(cur)||!supported);
    const counts={gold:entries.filter(e=>e.kind==='gold').length,
      platina:entries.filter(e=>e.kind==='platina').length,
      horse:entries.filter(e=>e.kind==='horse').length};
    const facs=typeof FACTIONS!=='undefined'?FACTIONS.filter(x=>Number.isInteger(x.id)&&x.id>=0):[];
    const img=p=>/^img\/[A-Za-z0-9_./-]+\.(png|webp)$/i.test(p||'')?`<img src="${esc(p)}" alt="" loading="lazy">`:'';
    const body=`<div class="hg-root" id="hg-root"><h3>✦ Kho trang bị cấp 130–180 · JXWEB</h3>
      <p class="desc">Dữ liệu trang bị JXWEB, sử dụng trong Võ Lâm Idle offline. Cấp yêu cầu là cấp nhân vật, không phải bậc vật phẩm.</p>
      <div class="hg-kinds">${Object.keys(kindNames).map(k=>`<button data-hg-kind="${k}" class="${state.kind===k?'active':''}">${kindNames[k]} · ${counts[k]}</button>`).join('')}</div>
      <div class="hg-filters"><label>Cấp yêu cầu<select id="hg-level"><option value="all">Tất cả (130+)</option>${[130,140,150,160,170,180].map(i=>`<option value="${i}" ${state.level===String(i)?'selected':''}>Cấp ${i}</option>`).join('')}</select></label>
      <label>Môn phái<select id="hg-school"><option value="mine" ${state.school==='mine'?'selected':''}>Phái của tôi / Bộ chung</option><option value="all" ${state.school==='all'?'selected':''}>Tất cả</option>${facs.map(f=>`<option value="${f.id}" ${state.school===String(f.id)?'selected':''}>${esc(f.n)}</option>`).join('')}</select></label>
      <label>Tìm tên<input id="hg-query" value="${esc(state.q)}" placeholder="Đằng Long, Bạch Hổ…"></label></div>
      <p class="hg-results">${rows.length} kết quả · Trang ${state.page+1}/${max+1}. ${!hasHero()?'Hãy tạo nhân vật để nhận trang bị.':''}</p>
      <div class="hg-items">${rows.slice(state.page*30,(state.page+1)*30).map(e=>`<button type="button" class="hg-item ${state.selected===e.id?'active':''}" data-hg-id="${esc(e.id)}">${img(e.icon)}<span><b>${esc(e.name)}</b><small>Cấp ${e.requiredLevel} · Bậc ${e.tier}</small></span></button>`).join('')||'<p>Không có trang bị phù hợp.</p>'}</div>
      <div class="hg-paging"><button id="hg-prev" ${state.page?'':'disabled'}>◀ Trước</button><button id="hg-next" ${state.page<max?'':'disabled'}>Sau ▶</button></div>
      ${cur?`<div class="hg-detail">${img(cur.icon)}<div><b>${esc(cur.name)}</b><p>Cấp yêu cầu: <strong>${cur.requiredLevel}</strong> · Bậc: ${cur.tier} · Loại: ${kindNames[cur.kind]}</p><p>${cur.schoolId>=0?'Yêu cầu môn phái ID '+cur.schoolId+' · ':''}${row&&row.fixed?'Đã được chuyển thể thông số cho engine offline.':'Dùng dữ liệu thuộc tính JXWEB.'}</p><p>${supported?'Có thể dựng vật phẩm trong engine offline.':'Chỉ xem dữ liệu: bản game hiện chưa hỗ trợ tạo đúng vật phẩm này.'}</p></div></div>
        <button id="hg-grant" class="hg-primary" ${limited||!hasHero()?'disabled':''}>✦ NHẬN VÀO HÀNH TRANG (OFFLINE)</button>`:''}
      <p class="hg-note">Trong bản offline, nút nhận trang bị dành cho người chơi muốn thử bộ đồ cấp cao. Vẫn áp dụng yêu cầu cấp, môn phái và giới tính khi mặc. Đồ được khóa để tránh tự bán; quái tinh anh/Boss cấp cao có xác suất rơi vật phẩm hợp lệ.</p>
      <button class="hg-close" id="hg-close">Đóng</button></div>`;
    modal(body,()=>{
      const root=document.getElementById('hg-root');if(!root)return;
      root.querySelectorAll('[data-hg-kind]').forEach(b=>b.addEventListener('click',()=>{state.kind=b.dataset.hgKind;state.page=0;state.selected=null;open()}));
      for(const [id,key] of [['hg-level','level'],['hg-school','school']]){const c=document.getElementById(id);if(c)c.addEventListener('change',()=>{state[key]=c.value;state.page=0;state.selected=null;open()});}
      const q=document.getElementById('hg-query');if(q)q.addEventListener('change',()=>{state.q=q.value;state.page=0;state.selected=null;open()});
      root.querySelectorAll('[data-hg-id]').forEach(b=>b.addEventListener('click',()=>{state.selected=b.dataset.hgId;open()}));
      for(const [id,delta] of [['hg-prev',-1],['hg-next',1]]){const b=document.getElementById(id);if(b)b.addEventListener('click',()=>{state.page+=delta;open()});}
      const grant=document.getElementById('hg-grant');if(grant)grant.addEventListener('click',()=>{
        if(grantById(state.selected))open();else typeof toast==='function'&&toast('Không thể nhận vật phẩm; kiểm tra cấp, hành trang hoặc dữ liệu nguồn.');
      });
      const close=document.getElementById('hg-close');if(close)close.addEventListener('click',()=>typeof closeModal==='function'&&closeModal(true));
    });
  }
  // Additional high-level drop: preserves the existing game's ordinary item table.
  // These are offline tuning rates, not claims of exact server drop probabilities.
  function tryHighDrop(enemy){
    if(!hasHero()||!isOffline()||!enemy||Number(enemy.L)<130||S.lvl<130)return null;
    if(enemy.cls!=='boss'&&enemy.cls!=='elite')return null;
    const prob=(enemy.cls==='boss'?.025:.003)*(typeof dropMul==='function'?dropMul():1);
    if(Math.random()>=Math.min(.15,prob))return null;
    const cap=Math.min(S.lvl,Number(enemy.L)+10);
    const platinum=enemy.cls==='boss'&&cap>=170&&Math.random()<.12;
    const pool=entries.filter(e=>e.kind===(platinum?'platina':'gold')&&e.requiredLevel<=cap&&
      (e.schoolId<0||e.schoolId===facId())&&ready(e)&&
      (typeof sexReqOk!=='function'||sexReqOk(match(e).req)));
    if(!pool.length)return null;
    const e=pool[Math.floor(Math.random()*pool.length)];
    const oldUid=S.uid,item=make(e);
    if(!item||typeof eqRemoved==='function'&&eqRemoved(item)){
      S.uid=oldUid;return null;
    }
    return item;
  }
  const oldRoll=typeof window.rollSetDrop==='function'?window.rollSetDrop:null;
  if(oldRoll)window.rollSetDrop=function(enemy){return tryHighDrop(enemy)||oldRoll(enemy);};
  // The catalogue remains callable by AdminCP, but has no extra floating buttons.
  // Keeping a duplicate shortcut caused the right-side 'Đồ 130+' overlay.
  function boot(){
    for(const id of ['vli-gear-fab','vli-gear-open','vli-gear-dock']){
      const node=document.getElementById(id);if(node)node.remove();
    }
  }
  window.VLIHighGear130={catalogue:entries,counts:{gold:352,platina:460,horse:horseEntries.length},horseQuality,qualityNames,open,ready,match,verify:window.VLI_HIGHGEAR_OK,grant:grantById,adminGrant:(id)=>adminGrantBatch([id]),adminGrantBatch,tryHighDrop,isOffline};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
