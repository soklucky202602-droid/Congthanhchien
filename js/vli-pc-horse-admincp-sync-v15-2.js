/* VLI Horse PC V15.2: synchronize K33-K75 into the existing 130+ AdminCP catalogue.
   Purely additive; do not alter saves, original horse rows or PC sprite sheets.
   Must be loaded AFTER vli-highgear-130.js and BEFORE admincp.js.
*/
(function(){
  'use strict';
  const scope='[VLI Horse V15.2]';
  const api=window.VLIHighGear130;
  const rows=window.JX&&window.JX.items&&window.JX.items[10]&&window.JX.items[10].list;
  const models=window.VLI_PC_HORSE_MODELS;
  const status={version:'15.2',ok:false,reason:'',added:0,updated:0,pcRows:0,pcModels:0,
    beforeCatalogue:0,afterCatalogue:0,afterHorseCatalogue:0,ready:0,missing:[],timestamp:new Date().toISOString()};
  window.VLI_HORSE_ADMINCP_V15_2=status;
  function fail(reason){status.reason=reason;console.error(scope,reason);}
  if(!api||!Array.isArray(api.catalogue))return fail('Thieu VLIHighGear130.catalogue - kiem tra thu tu nap script.');
  if(!Array.isArray(rows))return fail('Thieu JX.items[10].list - can cai V14.1 truoc.');
  if(!Array.isArray(models)||models.length!==43)return fail('Thieu danh muc 43 ngua PC V14.1.');
  const cat=api.catalogue;
  status.beforeCatalogue=cat.length;
  const required=(r)=>{
    const pair=Array.isArray(r.req)?r.req.find(x=>Array.isArray(x)&&Number(x[0])===36):null;
    return pair?Math.max(1,Number(pair[1])||1):Math.max(1,Number(r.lvl)||1);
  };
  const key=(k,lvl,n)=>String(k)+'|'+String(lvl)+'|'+String(n);
  const pc=rows.map((r,i)=>({r,i})).filter(({r})=>r&&Number.isInteger(r.k)&&r.k>=33&&r.k<=75&&
    Number.isInteger(r.lvl)&&typeof r.n==='string'&&r.n.length>0&&Array.isArray(r.base)&&Array.isArray(r.req));
  const found=new Map();
  for(const x of pc){const k=key(x.r.k,x.r.lvl,x.r.n);if(!found.has(k))found.set(k,x);}
  status.pcRows=found.size;
  status.pcModels=new Set(Array.from(found.values(),x=>x.r.k)).size;
  if(status.pcRows!==220||status.pcModels!==43)return fail('PC items khong du 220 bac / 43 loai; khong thay doi catalogue.');
  for(const {r,i} of found.values()){
    const existing=cat.find(e=>e&&e.kind==='horse'&&Number(e.subtype)===r.k&&Number(e.tier)===r.lvl&&e.name===r.n);
    const entry={id:'stable:'+i,kind:'horse',rowIndex:i,vliBuiltinHorse:1,
      requiredLevel:required(r),schoolId:-1,name:r.n,icon:r.ic||'',group:null,detail:10,
      subtype:r.k,tier:r.lvl,quality:-1,source:'ngua2.pak - VLI V15.2 PC horse'};
    if(existing){Object.assign(existing,entry);status.updated++}else{cat.push(entry);status.added++}
  }
  status.afterCatalogue=cat.length;
  status.afterHorseCatalogue=cat.filter(e=>e&&e.kind==='horse').length;
  if(api.counts&&typeof api.counts==='object')api.counts.horse=status.afterHorseCatalogue;
  // Some previous high-gear implementations reject every item below level 130;
  // do not weaken that rule for non-PC gear. Validate PC items against source rows
  // with exact requirements, affixes, model, subtype, level, icon and row ID.
  const previous=window.VLI_HIGHGEAR_OK;
  function pcValid(item){
    if(!item||item.vliHigh130!==1||item.d!==10||item.set||!Number.isInteger(item.k)||item.k<33||item.k>75)return false;
    const source=rows.find(r=>r&&r.k===item.k&&r.lvl===item.lvl&&r.n===item.n&&r.p===item.p);
    if(!source||item.s!==source.s||(item.ic||'')!==(source.ic||''))return false;
    function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>
      Array.isArray(x)&&Array.isArray(b[i])&&x.length===b[i].length&&x.every((v,j)=>v===b[i][j]));}
    return sameArray(item.req,source.req)&&sameArray(item.base,source.base);
  }
  if(typeof previous==='function'){
    window.VLI_HIGHGEAR_OK=function(item){
      if(item&&item.d===10&&item.k>=33&&item.k<=75)return pcValid(item);
      return previous(item);
    };
    api.verify=window.VLI_HIGHGEAR_OK;
  }
  status.ready=cat.filter(e=>e&&e.kind==='horse'&&e.subtype>=33&&e.subtype<=75&&
    (typeof api.ready!=='function'||api.ready(e))).length;
  for(const m of models){if(!cat.some(e=>e&&e.kind==='horse'&&e.subtype===m.k))status.missing.push(m.k);}
  status.ok=status.ready===220&&status.missing.length===0;
  if(!status.ok)return fail('Co ma ngua chua san sang; ready='+status.ready+'/220, missing='+status.missing.join(','));
  console.info(scope,'AdminCP synced: '+status.pcModels+' ngua PC / '+status.pcRows+' bac; +'+status.added+', updated '+status.updated+'; horse catalogue '+status.afterHorseCatalogue+'.');
})();
