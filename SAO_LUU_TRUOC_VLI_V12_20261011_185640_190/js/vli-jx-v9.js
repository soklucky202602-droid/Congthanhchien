/* VLI V11 corrected upgrade action + restored Tay Tuy button. Based on V9 UI only. Restyles the V8 overlay and renders a JX-inspired split skill window.
   Gameplay, S.main/S.slots actions, 120/150 skills, combat, save and Auto remain in the original game. */
(function () {
  'use strict';
  if (window.__VLI_JX_V9__) return;
  window.__VLI_JX_V9__ = true;
  const byId = id => document.getElementById(id);
  const escText = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ui = { kind: 'all', page: 0, selected: 0, listScroll: 0, skillPatched: false, busy: false };
  const desktop = () => window.innerWidth >= 900 && window.innerHeight >= 560 && window.innerWidth > window.innerHeight;
  const enabled = () => desktop() && document.body.classList.contains('u20') && document.body.classList.contains('v8-jx');
  const havePlayer = () => typeof S !== 'undefined' && !!S && !!S.fac && typeof FAC !== 'undefined' && !!FAC[S.fac];
  const skills = () => (FAC[S.fac].skills || []).map(x => typeof SK !== 'undefined' && SK[x]).filter(Boolean);
  const mainIs = id => typeof R !== 'undefined' && R.P && R.P.main && +R.P.main.id === +id;
  const attack = sk => typeof isAttack === 'function' ? isAttack(sk) : !!sk.hurt;
  function getPageSkills(list) { return list.slice(ui.page * 30, ui.page * 30 + 30); }
  function getFiltered(){
    const all = skills();
    return ui.kind === 'assist' ? all.filter(s => !attack(s)) : all;
  }
  function safeDesc(sk) {
    const v = sk.d || sk.desc || sk.prop || '';
    return escText(v).slice(0, 160);
  }
  function skillType(sk){
    if (attack(sk)) return 'Tấn công';
    if (/hỗ trợ|bị động/i.test(sk.prop||'')) return 'Nội tại';
    return 'Hỗ trợ';
  }
  function skillRow(sk){
    const lv = S.sk[sk.id] || 0, bonus = lv && typeof skillBonusLv === 'function' ? skillBonusLv(sk.id) : 0;
    const effective = lv + bonus;
    const can = typeof canLearn === 'function' && canLearn(sk);
    const active = attack(sk) && lv > 0;
    const primary = active && mainIs(sk.id);
    const shortcuts = active ? `<div class="v9-slotline"><span>Ô:</span>${[0,1,2,3].map(i => `<button type="button" class="v9-slot ${S.slots && +S.slots[i] === +sk.id ? 'on' : ''}" data-v9-slot="${i}" data-v9-id="${sk.id}" title="Gán kỹ năng vào F${i+1}">${i+1}</button>`).join('')}${!primary ? `<button type="button" class="v9-primary" data-v9-main="${sk.id}" title="Đặt làm chiêu chính">Chiêu chính</button>` : '<span class="v9-current">★ Chiêu chính</span>'}</div>` : '';
    const label = skillType(sk);
    const over = sk.max || 20;
    const lowLevel = S.lvl < (sk.req || 1);
    return `<article class="v9-skill-card ${primary ? 'is-primary' : ''}${ui.selected===sk.id ? ' is-selected' : ''}" data-v9-card="${sk.id}">
       <button type="button" class="v9-skill-detail" data-v9-detail="${sk.id}" title="Xem chi tiết kỹ năng"><img src="${escText(sk.ic||'img/s/8.png')}" alt="${escText(sk.n)}" loading="lazy"></button>
       <div class="v9-card-info"><div class="v9-skill-name">${escText(sk.n)}${primary ? ' <span class="v9-star">★</span>' : ''}</div>
       <div class="v9-skill-type">${label}</div><p class="v9-skill-meta">Cấp yêu cầu ${sk.req||1}${lowLevel ? ' · <b>Chưa đủ cấp</b>' : ''}</p>
       ${lv ? `<p class="v9-skill-desc">${safeDesc(sk)}</p>` : ''}</div>
       <div class="v9-skill-controls"><span class="v9-lvl">${effective}</span><span class="v9-skill-progress">Học ${lv}/${over}</span>
         <button type="button" class="v9-smallbtn v9-add" data-v9-plus="${sk.id}" ${can ? '' : 'disabled'} title="Cộng một cấp võ công">+</button>
         <button type="button" class="v9-smallbtn" data-v9-minus="${sk.id}" ${lv ? '' : 'disabled'} title="Rút một cấp võ công">−</button>
         <button type="button" class="v9-smallbtn v9-help" data-v9-detail="${sk.id}" title="Xem thuộc tính kỹ năng">?</button></div>
       ${shortcuts}
     </article>`;
  }
  function gridTile(sk){
    if(!sk) return '<span class="v9-grid-empty" aria-hidden="true"></span>';
    const lv = S.sk[sk.id] || 0, can = typeof canLearn==='function' && canLearn(sk);
    // The red + must be a separate button, not decoration inside the select-skill button.
    // Clicking a skill icon selects it; clicking + upgrades it (if game rules allow).
    return `<div class="v9-skill-tile ${lv?'learned':'unlearned'}${mainIs(sk.id) ? ' primary':''}${ui.selected===sk.id?' selected':''}${can?' available':''}" title="${escText(sk.n)} · ${lv}/${sk.max||20}">
      <button type="button" class="v11-tile-select" data-v9-pick="${sk.id}" aria-label="Xem kỹ năng ${escText(sk.n)}"><img src="${escText(sk.ic||'img/s/8.png')}" alt=""></button>
      <span class="v9-tile-lv">${lv}</span>
      ${can?`<button type="button" class="v9-tile-plus" data-v9-plus="${sk.id}" title="Cộng 1 điểm ${escText(sk.n)}" aria-label="Cộng điểm kỹ năng ${escText(sk.n)}">+</button>`:''}
    </div>`;
  }
  function newSkillMarkup() {
    const list = getFiltered(), maxPage = Math.max(1, Math.ceil(list.length / 30));
    ui.page = Math.max(0, Math.min(ui.page, maxPage-1));
    if (!ui.selected && list.length) ui.selected = list[0].id;
    const gridSkills = getPageSkills(list);
    const grid = Array.from({length:30},(_,i) => gridTile(gridSkills[i])).join('');
    const name = FAC[S.fac].n || 'Võ công';
    const pts = S.skPts || 0;
    return `<div class="v9-skill-shell" aria-label="Bảng kỹ năng Võ Lâm">
     <section class="v9-skill-book">
       <div class="v9-book-title"><span class="v9-title-seal">◉</span><strong>KỸ NĂNG VÕ CÔNG</strong></div>
       <div class="v9-book-tabs"><button type="button" data-v9-filter="all" class="${ui.kind==='all'?'on':''}">Chiêu thức</button><button type="button" data-v9-filter="assist" class="${ui.kind==='assist'?'on':''}">Kỹ năng hỗ trợ</button></div>
       <div class="v9-skill-grid">${grid}</div>
       <div class="v9-book-foot"><div class="v9-page-switch"><button type="button" data-v9-page="prev" ${ui.page===0?'disabled':''}>Trang ◀</button><button type="button" data-v9-page="next" ${ui.page>=maxPage-1?'disabled':''}>▶ ${ui.page+1}/${maxPage}</button></div><span>Điểm kỹ năng <b>${pts}</b></span></div>
       <button type="button" class="v9-close-button" data-v9-close="1">Đóng</button>
       <button type="button" class="v9-helper-link" data-v9-helper="1">▸ Trợ thủ: ${escText(name)}</button>
     </section>
     <section class="v9-skill-learn">
       <div class="v9-learn-header"><span class="v9-head-icon">◉</span><strong>${escText(name)}</strong><span class="v11-available-points" title="Điểm kỹ năng còn lại"><b>${pts}</b> điểm</span><div class="v11-head-actions"><button type="button" data-v9-suggest="1">Gợi ý</button><button type="button" data-v9-reset="1" title="Tẩy Tủy: hoàn lại điểm kỹ năng hoặc tiềm năng">Tẩy Tủy</button></div><button type="button" class="v9-small-close" data-v9-close="1" title="Đóng cửa sổ">×</button></div>
       <div class="v9-learn-scroll">
         <label class="v9-auto-rot"><input type="checkbox" data-v9-rot="1" ${S.rot!==false?'checked':''}> Xoay chiêu tự động khi farm: luân phiên chiêu ở ô 1 đến 4 (phím R), luôn có 2 chiêu mạnh nhất, bỏ chiêu hết nội lực</label>
         <p class="v9-help-note">Chiêu nội công và ngoại công cùng nguyên tố hỗ trợ nhau tối đa 12%. Chạm vào chiêu tấn công đã học để khóa làm chiêu chính (bỏ khóa được).</p>
         <div class="v9-skill-cards">${list.map(skillRow).join('') || '<div class="v9-empty-skill">Chưa có kỹ năng hỗ trợ nào.</div>'}</div>
       </div>
     </section>
    </div>`;
  }
  function shouldUseSkillUI(){return enabled() && havePlayer() && typeof SK !== 'undefined';}
  function renderV9(){
    if(!shouldUseSkillUI()) return false;
    const target = byId('t-skill');
    if(!target) return false;
    // Original renderSkill20 normally sets this via u2win('skill').
    document.body.dataset.u2t = 'skill';
    const existing = target.querySelector('.v9-learn-scroll');
    if(existing) ui.listScroll=existing.scrollTop;
    target.innerHTML=newSkillMarkup();
    const scroll = target.querySelector('.v9-learn-scroll');
    if(scroll) scroll.scrollTop=ui.listScroll;
    if(!target.__v9Events){target.__v9Events=true;target.addEventListener('click', handleSkillClick);target.addEventListener('change', handleSkillChange);}
    return true;
  }
  function refreshSkills(focusId){
    if(focusId)ui.selected=+focusId;
    if(typeof renderSkill==='function')renderSkill();
    if (focusId){const scroll=byId('t-skill')&&byId('t-skill').querySelector('.v9-learn-scroll');const card=byId('t-skill')&&byId('t-skill').querySelector(`[data-v9-card="${focusId}"]`);if(scroll&&card){const y=card.offsetTop-scroll.offsetTop; if (y<scroll.scrollTop||y>scroll.scrollTop+scroll.clientHeight-90)scroll.scrollTop=Math.max(0,y-70);ui.listScroll=scroll.scrollTop;}}
  }
  function closeSkills(){if(typeof u20Close === 'function')u20Close();}
  function handleSkillClick(evt){
    if(!shouldUseSkillUI())return;
    const t=evt.target.closest('[data-v9-pick], [data-v9-plus], [data-v9-minus], [data-v9-detail], [data-v9-main], [data-v9-slot], [data-v9-page], [data-v9-filter], [data-v9-suggest], [data-v9-reset], [data-v9-helper], [data-v9-close]');
    if(!t)return;
    evt.stopPropagation();
    if(t.hasAttribute('data-v9-close')){closeSkills();return;}
    if(t.hasAttribute('data-v9-page')){ui.page += t.dataset.v9Page==='next'?1:-1;ui.listScroll=0;renderV9();return;}
    if(t.hasAttribute('data-v9-filter')){ui.kind=t.dataset.v9Filter;ui.page=0;ui.listScroll=0;ui.selected=0;renderV9();return;}
    if(t.hasAttribute('data-v9-helper')){if(typeof u20Tt==='function')u20Tt('skill');return;}
    if(t.hasAttribute('data-v9-suggest')){if(typeof suggestModal==='function')suggestModal();return;}
    if(t.hasAttribute('data-v9-reset')){if(typeof tayTuyModal==='function')tayTuyModal();return;}
    const id=+(t.dataset.v9Pick||t.dataset.v9Plus||t.dataset.v9Minus||t.dataset.v9Detail||t.dataset.v9Main||t.dataset.v9Id)||0;
    if(!id || typeof SK==='undefined'||!SK[id])return;
    ui.selected=id;
    if(t.hasAttribute('data-v9-pick')){refreshSkills(id);return;}
    if(t.hasAttribute('data-v9-detail')){if(typeof skillModal==='function')skillModal(id);return;}
    if(t.hasAttribute('data-v9-plus')){
      // Use native skLearn so requirements, caps, books and 120/150 rules stay intact.
      const mayLearn=typeof canLearn==='function'&&canLearn(SK[id]);
      if(mayLearn&&typeof skLearn==='function'&&skLearn(id)){
        if(typeof uiSfx==='function')uiSfx('learn');
        if(typeof R!=='undefined')R.dirty=true;
        if(typeof recalc==='function')recalc();
        if(typeof renderPad==='function')renderPad();
        if(typeof save==='function')save();
      }
      refreshSkills(id);return;
    }
    if(t.hasAttribute('data-v9-minus')){if(typeof unlearnSkill==='function')unlearnSkill(id);refreshSkills(id);return;}
    if(t.hasAttribute('data-v9-main')){
      if(typeof selectPrimarySkillV8==='function'){
        const ok=selectPrimarySkillV8(id);
        if(ok&&typeof toast==='function')toast('Chiêu chính: '+SK[id].n);
        if(ok&&typeof renderPad==='function')renderPad();
      }else if(typeof skillModal==='function'){skillModal(id)}
      refreshSkills(id);return;
    }
    if(t.hasAttribute('data-v9-slot')){
      if(typeof assignSlot==='function')assignSlot(+t.dataset.v9Slot,id);
      refreshSkills(id);return;
    }
  }
  function handleSkillChange(evt){
    const t=evt.target.closest('[data-v9-rot]');if(!t)return;
    if(!havePlayer())return;
    S.rot=!!t.checked;
    if(typeof refreshRotBtn==='function')refreshRotBtn();
    if(typeof R!=='undefined')R.dirty=true;
    if(typeof save==='function')save();
  }
  function patchSkill(){
    if(ui.skillPatched||typeof renderSkill!=='function')return;
    const prev=renderSkill;
    renderSkill=function(){if(!renderV9())return prev.apply(this,arguments);};
    ui.skillPatched=true;
  }
  function decorateV8(){
    const left=byId('v8left'),bar=byId('v8bar'),right=byId('v8right');
    if(!left||!bar||!right)return;
    if(!byId('v9brand')){
      const q=document.createElement('span');q.id='v9brand';q.textContent='JX IDLE';left.appendChild(q);
    }
    // V8 side controls are preserved, but their names and visuals follow the provided reference.
    const defs={journal:['Nhật ký','📔'],gift:['Quà','🎁'],auto:['Tự cày','⚔'],today:['Hôm nay','📜'],inv:['Nhặt','🎒'],forge:['Rèn','⚒'],skill:['Võ công','⚜'],expand:['Mở rộng','•••']};
    right.querySelectorAll('[data-v8act]').forEach(b=>{
      const d=defs[b.dataset.v8act];if(!d)return;
      b.title=d[0];b.setAttribute('aria-label',d[0]);
      const lab=b.querySelector('span');if(lab)lab.textContent=d[0];
      const ico=b.querySelector('i');if(ico)ico.textContent=d[1];
    });
    const shortcuts={questmode:'map',farmmode:'ride',dgmode:'team',tk:'flag',towermode:'tower'};
    left.querySelectorAll('.v8action').forEach(b=>b.setAttribute('data-v9-style',shortcuts[b.dataset.v8act]||'map'));
    bar.classList.add('v9-ornate-bar');
  }
  let tick=0;
  function apply(){
    patchSkill();decorateV8();
    document.body.classList.toggle('v9-jx',enabled());
    if(!document.body.classList.contains('v9-jx'))return;
    const root=byId('t-skill');if(root&&document.body.dataset.u2t==='skill'&&document.body.classList.contains('u20win')&&!root.querySelector('.v9-skill-shell'))renderV9();
  }
  function boot(){
    if(!byId('battle'))return;
    apply();
    setInterval(apply,650);
    window.addEventListener('resize',()=>requestAnimationFrame(apply));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
