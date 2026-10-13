"use strict";
/* VLI SERVER CONFIG - offline/global gameplay multipliers.
 * Shared through localStorage so /admv/ and the game use the same values.
 */
(function(){
  const KEY = "jxidle_server_cfg";
  const DEFAULTS = {
    xp: 1,
    gold: 1,
    knb: 1,
    drop: 1,
    hkDrop: 1,
    material: 1,
    playerDamage: 1,
    monsterDamage: 1,
    monsterHp: 1,
    monsterSpeed: 1,
    gameSpeed: 1
  };
  const clampNum = (v, min=0.05, max=100) => Math.max(min, Math.min(max, Number(v) || 1));
  function read(){
    try { const x=JSON.parse(localStorage.getItem(KEY)||"{}"); return Object.assign({},DEFAULTS,x||{}); }
    catch { return Object.assign({},DEFAULTS); }
  }
  function save(x){ localStorage.setItem(KEY, JSON.stringify(x)); return x; }
  function setAll(patch){ const x=read(); for(const k in patch) if(k in DEFAULTS) x[k]=clampNum(patch[k]); save(x); return x; }
  window.VLI_SERVER_DEFAULTS = Object.freeze(Object.assign({},DEFAULTS));
  window.VLI_SERVER_CONFIG = { key:KEY, read, save, setAll, defaults:DEFAULTS };

  function cfg(){ return read(); }
  function wrap(name, fn){
    const old=window[name];
    if(typeof old!=="function" || old.__vliServerWrapped) return;
    const wrapped=fn(old);
    wrapped.__vliServerWrapped=true;
    window[name]=wrapped;
  }

  // XP: central entry point used by combat, offline and activity rewards.
  wrap("gainXp", old => function(x){ return old.call(this, (+x||0)*cfg().xp); });

  // Gold: moneyDrop feeds normal kill rewards and offline rewards.
  wrap("moneyDrop", old => function(e){ return old.call(this,e)*cfg().gold; });

  // Normal / elite / boss item drops.
  wrap("rollDrops", old => function(e){
    const c=cfg(), x=Object.assign({},e||{});
    x.bonusDrop=(+x.bonusDrop||1)*c.drop;
    return old.call(this,x);
  });

  // Hoàng Kim chance. Preserve the original result shape and only repeat the roll
  // when the server multiplier is above 1; for values below 1, suppress by chance.
  wrap("rollSetDrop", old => function(e){
    const m=cfg().hkDrop;
    if(m<=0) return null;
    if(m<1 && Math.random()>m) return null;
    let r=old.call(this,e);
    if(!r && m>1){
      for(let i=1;i<Math.min(20,Math.floor(m));i++){ r=old.call(this,e); if(r) break; }
    }
    return r;
  });

  // Monster HP / damage are created here, before they enter the combat loop.
  wrap("enemyStats", old => function(L,cls){
    const r=old.call(this,L,cls), c=cfg();
    if(r){ r.hp*=c.monsterHp; r.dmg*=c.monsterDamage; }
    return r;
  });

  // Player damage: apply the multiplier to the actual HP delta, so all physical,
  // elemental, crit and resistance calculations remain untouched.
  wrap("heroHit", old => function(a,e){
    const before=e&&typeof e.hp==="number"?e.hp:null;
    const out=old.call(this,a,e);
    const m=cfg().playerDamage;
    if(before!==null && e && typeof e.hp==="number" && m!==1 && before>e.hp){
      const dealt=before-e.hp;
      e.hp += dealt*(1-m);
      return dealt*m;
    }
    return out;
  });

  // Monster movement/attack cadence and the whole combat loop can be scaled
  // independently. monsterSpeed is applied to enemyAI; gameSpeed scales the tick.
  wrap("enemyAI", old => function(e,dt){
    const c=cfg();
    return old.call(this,e,(+dt||0)*c.monsterSpeed);
  });
  wrap("tick", old => function(dt){
    const c=cfg();
    return old.call(this,(+dt||0)*c.gameSpeed);
  });

  // KNB is granted by reward objects, shops and some systems. Wrap grant only if
  // it exists; the reward's KNB field is the server-controlled amount.
  wrap("grant", old => function(t,n){
    const c=cfg();
    if(t && t.knb) t=Object.assign({},t,{knb:(+t.knb||0)*c.knb});
    return old.call(this,t,n);
  });

  // Material rewards are represented by the common matAdd helper in the source.
  wrap("matAdd", old => function(kind,id,n){ return old.call(this,kind,id,(+n||0)*cfg().material); });
})();
