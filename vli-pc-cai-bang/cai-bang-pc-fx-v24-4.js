/* Vo Lam Idle H5: native JX PC Cai Bang skill effects from skills(3).pak.
   V24.4 optional visual-only patch; never mutates gameplay or save. */
(function(){
  'use strict';
  if(window.VLI_CAI_BANG_PC_FX) return;
  const VERSION='24.4.0';
  const spriteTable={"04E27976":{"fit":{"f":"vli-pc-cai-bang/assets/04E27976_fit.webp","n":4,"d":16,"w":134,"h":76,"ax":66.95,"ay":55.25,"ms":50},"native":{"f":"vli-pc-cai-bang/assets/04E27976_native.webp","n":4,"d":16,"w":206,"h":116,"ax":103.0,"ay":85.0,"ms":50}},"3CAE8F47":{"fit":{"f":"vli-pc-cai-bang/assets/3CAE8F47_fit.webp","n":5,"d":1,"w":57,"h":55,"ax":29.25,"ay":40.95,"ms":50},"native":{"f":"vli-pc-cai-bang/assets/3CAE8F47_native.webp","n":5,"d":1,"w":87,"h":84,"ax":45.0,"ay":63.0,"ms":50}},"8A1DF06D":{"fit":{"f":"vli-pc-cai-bang/assets/8A1DF06D_fit.webp","n":8,"d":1,"w":61,"h":64,"ax":33.15,"ay":50.7,"ms":111},"native":{"f":"vli-pc-cai-bang/assets/8A1DF06D_native.webp","n":8,"d":1,"w":93,"h":97,"ax":51.0,"ay":78.0,"ms":111}},"A31B9F04":{"fit":{"f":"vli-pc-cai-bang/assets/A31B9F04_fit.webp","n":5,"d":16,"w":194,"h":107,"ax":97.5,"ay":76.05,"ms":50},"native":{"f":"vli-pc-cai-bang/assets/A31B9F04_native.webp","n":5,"d":16,"w":297,"h":164,"ax":150.0,"ay":117.0,"ms":50}},"AFB1607E":{"fit":{"f":"vli-pc-cai-bang/assets/AFB1607E_fit.webp","n":4,"d":16,"w":32,"h":32,"ax":15.6,"ay":35.75,"ms":50},"native":{"f":"vli-pc-cai-bang/assets/AFB1607E_native.webp","n":4,"d":16,"w":48,"h":48,"ax":24.0,"ay":55.0,"ms":50}},"B91AB706":{"fit":{"f":"vli-pc-cai-bang/assets/B91AB706_fit.webp","n":6,"d":1,"w":108,"h":75,"ax":53.95,"ay":50.7,"ms":100},"native":{"f":"vli-pc-cai-bang/assets/B91AB706_native.webp","n":6,"d":1,"w":165,"h":114,"ax":83.0,"ay":78.0,"ms":100}},"C33E96C2":{"fit":{"f":"vli-pc-cai-bang/assets/C33E96C2_fit.webp","n":6,"d":1,"w":67,"h":67,"ax":33.15,"ay":59.15,"ms":111},"native":{"f":"vli-pc-cai-bang/assets/C33E96C2_native.webp","n":6,"d":1,"w":103,"h":103,"ax":51.0,"ay":91.0,"ms":111}},"C723E35A":{"fit":{"f":"vli-pc-cai-bang/assets/C723E35A_fit.webp","n":4,"d":16,"w":84,"h":43,"ax":41.6,"ay":37.7,"ms":50},"native":{"f":"vli-pc-cai-bang/assets/C723E35A_native.webp","n":4,"d":16,"w":128,"h":65,"ax":64.0,"ay":58.0,"ms":50}}};
  const missiles={"45":{"fly":"C723E35A","hit":"8A1DF06D"},"46":{"fly":"AFB1607E","hit":"8A1DF06D"},"47":{"fly":"04E27976","hit":"B91AB706"},"48":{"fly":"A31B9F04","hit":"C33E96C2"},"166":{"fly":"A31B9F04","hit":"C33E96C2"},"168":{"fly":"04E27976","hit":"B91AB706"}};
  const casters={"5":"3CAE8F47","6":"B91AB706"};
  const schoolSkills={"119":45,"122":46,"125":47,"128":48,"357":166,"359":168,"768":166,"769":168};
  const activeSkills=[119, 122, 125, 128, 357, 359, 768, 769];
  const supportSkills=[115, 116, 129, 124, 274, 277, 130, 360, 714];
  const paths={};
  for(const [mid,parts] of Object.entries(missiles)) {
    for(const [phase,key] of Object.entries(parts)) {
      paths['fx/m'+mid+'_'+phase+'.webp']=key;
    }
  }
  for(const [id,key] of Object.entries(casters))paths['fx/c'+id+'.webp']=key;
  const STORAGE='vli_pc_cai_bang_fx_quality';
  let mode='fit';
  try {if(localStorage.getItem(STORAGE)==='native') mode='native';}catch(_){}
  const loaded=Object.create(null);
  const preloadRefs=[];
  function preload(quality){
    for(const data of Object.values(spriteTable)){
      const v=data[quality];
      if(Object.prototype.hasOwnProperty.call(loaded,v.f))continue;
      try{const i=new Image();preloadRefs.push(i);loaded[v.f]=false;
        i.onload=()=>{loaded[v.f]=i.naturalWidth>0&&i.naturalHeight>0;};
        i.onerror=()=>{loaded[v.f]=false;};i.src=v.f;
      }catch(_){}
    }
  }
  preload(mode);
  let casts=0,converted=0,patches=0,lastId=0,errors=0;
  const original=window.skillFx;
  const api=window.VLI_CAI_BANG_PC_FX={
    version:VERSION,
    setQuality(v){if(v!=='fit'&&v!=='native')return false;preload(v);mode=v;
      try{localStorage.setItem(STORAGE,v);}catch(_){}
      return mode;
    },
    getQuality(){return mode;},
    status(){return {version:VERSION,installed:patches>0,quality:mode,
      attacksCovered:activeSkills.length,supportSkillsWithoutMissiles:supportSkills.length,
      totalFactionSkills:activeSkills.length+supportSkills.length,
      nativeSprites:Object.keys(spriteTable).length,assetsReady:Object.values(loaded).filter(Boolean).length,assetsTotal:Object.keys(loaded).length,casts,converted,lastSkillId:lastId,
      errors,originalRendererPresent:typeof original==='function',
      note:'PC sprites for flying/impact/cast; no simulated buff projectile. Skills 150 reuse original art linked by current JXWEB data.'};},
    skillList:schoolSkills,
    verifyImages:async function(){
      const urls=Object.values(spriteTable).map(entry=>entry[mode].f);
      const uniq=[...new Set(urls)];
      return Promise.all(uniq.map(url=>new Promise(done=>{
        const im=new Image();im.onload=()=>done({src:url,ok:im.naturalWidth>0&&im.naturalHeight>0,
          width:im.naturalWidth,height:im.naturalHeight});
        im.onerror=()=>done({src:url,ok:false});im.src=url;
      })));
    }
  };
  if(typeof original!=='function') {
    console.error('[Cai Bang V24.4] Missing skillFx renderer; installation skipped.');
    return;
  }
  // Modify only sprites emitted for the eight verified Cai Bang attack IDs.
  // Save/HP/damage and skill selection always use original game logic.
  const wrapped=function(from,to,skill){
    const sid=Number(skill&&skill.id);
    if(!Object.prototype.hasOwnProperty.call(schoolSkills,sid)||!activeSkills.includes(sid))
      return original.apply(this,arguments);
    let start=-1;
    try {if(typeof R!=='undefined'&&Array.isArray(R.fx))start=R.fx.length;}catch(_){}
    const result=original.apply(this,arguments);
    lastId=sid;casts++;
    try{
      if(start<0||typeof R==='undefined'||!Array.isArray(R.fx))return result;
      for(let i=start;i<R.fx.length;i++){
        const fx=R.fx[i];if(!fx)continue;
        let changed=false;
        for(const field of ['s','hit']){
          const old=fx[field];
          if(!old||typeof old.f!=='string')continue;
          const sourceKey=paths[old.f.replace(/[?#].*$/,'')];
          const meta=spriteTable[sourceKey]&&spriteTable[sourceKey][mode];
          if(meta&&loaded[meta.f]){
            fx[field]=Object.assign({},old,meta);
            changed=true;
          }
        }
        if(changed){converted++;fx.__pcCaiBang=true;
          // For cast effects, avoid leaving a finished static sprite for seconds.
          if(fx.k==='boom'&&fx.s?.f?.includes('vli-pc-cai-bang/')){
            const full=Math.min(1.2,fx.s.n*fx.s.ms/1000);
            if(Number.isFinite(full)&&full>0)fx.life=Math.min(Number(fx.life)||full,full);
          }
        }
      }
    }catch(e){errors++;console.warn('[Cai Bang V24.4] FX conversion:',e);}
    return result;
  };
  window.skillFx=wrapped;
  patches++;
  console.info('[Cai Bang V24.4] Native PC SPR mapped to existing skills.',api.status());
})();
