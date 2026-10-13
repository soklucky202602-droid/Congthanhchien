/* VLI V23.2: mounted-sprite recovery, intentionally non-destructive.
 * Uninstalls the V23.1 strict mapping through installer; DOES NOT replace global jxHorseRow.
 * Uses existing V15 PC SPR atlas, centers and geometry; never substitutes incorrect models.
 */
(function(){
  "use strict";
  if(window.VLI_PC_HORSE_RECOVERY_232) return;
  var version="23.2.0", last="", refreshCount=0, warned={}, checks={}, mapperInstalled=false;
  var mountActions={st:"骑马站立",walk:"骑马走路",run:"骑马跑步",at:"骑马攻击劈",stab:"骑马攻击刺",mg:"骑马魔法",hurt:"骑马受伤",die:"骑马死亡"};
  var layers=["马后","马中","马前"];
  function horse(){try{return typeof S!=="undefined" && S && S.eq && S.eq.horse || null;}catch(e){return null;}}
  function mounted(){try{return typeof R!=="undefined" && !!R.mounted;}catch(e){return false;}}
  function kind(h){return h && +h.d===10 && Number.isInteger(+h.k) ? +h.k : -1;}
  function expected(k){var val=(window.VLI_PC_HORSE_EXACT_ROWS||{})[k];return k>=34 && k<=75 && Number.isInteger(+val) && +val===300+k ? +val : -1;}
  function jxl(){return window.JXLOOK||null;}
  function warn(key,txt){if(warned[key])return;warned[key]=true;console.warn('[VLI Horse 23.2]',txt);}
  function assets(k,act){
    var row=expected(k),p=window.VLI_PC_HORSE_PARTS||{},a=mountActions[act]||mountActions.st;
    if(row<0)return [];
    return layers.map(function(name){var b=p[name]&&p[name][row]&&p[name][row][a];return b?'img/jx/m/'+b+'.png':null;});
  }
  function validate(k){
    if(k===33)return {ok:false,kind:k,row:-1,reason:'K33: 24 original PC mounted SPR animations missing from provided archive'};
    var row=expected(k), j=jxl(), p=window.VLI_PC_HORSE_PARTS||{},meta=window.VLI_PC_HORSE_SHEET_META||{},problems=[];
    if(row<0)problems.push('No exact row');
    for(var i=0;i<layers.length;i++){
      var name=layers[i],b=p[name]&&p[name][row]&&p[name][row][mountActions.st], key=b&&'m/'+b;
      if(!b||!Array.isArray(meta[key]))problems.push(name+': atlas missing');
      for(var sex of ['m','f'])if(!j||!j.tabs||!j.tabs[sex]||!j.tabs[sex][name]||!j.tabs[sex][name][row]||!j.tabs[sex][name][row][mountActions.st])problems.push(name+':'+sex+': registered row missing');
    }
    return {ok:!problems.length,kind:k,row:row,problems:problems};
  }
  // Repair only K34-K75: the V14 runtime can be absent or run before its item catalogue.
  // Crucially, old K0-K33 are delegated UNCHANGED to the original mapper.
  var legacyMapper=typeof jxHorseRow==='function'?jxHorseRow:null;
  if(legacyMapper){
    jxHorseRow=function(item){
      var k=kind(item),row=expected(k);
      if(row>=334 && validate(k).ok)return row;
      return legacyMapper(item);
    };
    mapperInstalled=true;
  }else{warn('mapper','Missing jxHorseRow, cannot restore PC riding row.');}
  function imageProbe(k,act){
    var a=assets(k,act);
    if(a.length!==3 || a.some(function(x){return !x;}))return Promise.resolve({k:k,ok:false,images:a,reason:'Missing sprites metadata'});
    return Promise.all(a.map(function(src){return new Promise(function(done){
      var im=new Image(); im.onload=function(){done({src:src,ok:im.naturalWidth>0&&im.naturalHeight>0,width:im.naturalWidth,height:im.naturalHeight});};
      im.onerror=function(){done({src:src,ok:false,error:'image not found or cannot load'});};
      im.src=src;
    });})).then(function(results){var good=results.every(function(x){return x.ok;});checks[k+':'+(act||'st')]=good;return {k:k,row:expected(k),ok:good,images:results,origin:location.origin};});
  }
  function current(){try{return typeof R!=="undefined"&&R&&R.jx&&R.jx.rows?R.jx.rows.horse:null;}catch(e){return null;}}
  function sync(force){
    try{
      if(typeof S==='undefined'||!S||!S.fac||typeof R==='undefined'||!R||typeof jxSetup!=='function')return false;
      if(typeof jxOn==='function'&&!jxOn())return false;
      var h=horse(),k=kind(h),r=expected(k),mountedNow=mounted();
      var sig=String(k)+'|'+(S.sex?'f':'m')+'|'+(mountedNow?1:0)+'|'+(h&&h.uid||'');
      var next=jxSetup();
      if(!next||!next.rows)return false;
      if(mountedNow && r>=334){
        var v=validate(k);
        if(!v.ok)warn('atlas'+k,'K'+k+' PC sprites metadata incomplete: '+v.problems.join(', '));
        if(v.ok && +next.rows.horse!==r)warn('row'+k,'K'+k+' jxSetup() returned '+next.rows.horse+' instead of '+r);
      }
      // Always recompute ONLY the visual model on horse/equip/ride changes.
      // This fixes stale horses when the user switches between older and expanded mounts.
      if(!force&&last===sig&&R.jx&&R.jx.key===next.key)return false;
      if(!R.jx || R.jx.key!==next.key || force){
        R.jx=next;refreshCount++;
        if(typeof jxPreload==='function')jxPreload();
      }
      last=sig;
      if(mountedNow && r>=334 && checks[k+':st']===undefined){
        checks[k+':st']='checking';
        imageProbe(k,'st').then(function(result){
          checks[k+':st']=result.ok;
          if(!result.ok)warn('png'+k,'K'+k+' sprite PNG cannot load. Install FULL ASSET V23.2 package.');
        });
      }
      return true;
    }catch(e){warn('sync',String(e));return false;}
  }
  function status(){var h=horse(), k=kind(h),row=expected(k);return {
    version:version,origin:location.origin,mounted:mounted(),horseK:k,horseName:h&&h.n||null,
    expectedRow:row,renderedRow:current(),match:k>=34 && k<=75?Number(current())===row:null,
    currentHorseSpriteCheck: checks[k+':st']===undefined?'not checked yet':checks[k+':st'],
    pcAtlas:validate(k),refreshes:refreshCount,exactMapperInstalled:mapperInstalled,
    note:k===33?'K33 missing original riding animations; this release does not fabricate them':
      k>=34&&k<=75?'V15 PC sprites and renderer preserved; only K34-K75 get exact row, old mounts use legacy mapper':
      'Older mounts use original JX mapping; not modified by this patch'
  };}
  window.VLI_PC_HORSE_RECOVERY_232={version:version,status:status,verifyImages:imageProbe,validate:validate,forceRefresh:function(){last='';return sync(true);},allStatus:function(){return Array.from({length:42},function(_,i){return validate(i+34);});}};
  window.setInterval(function(){sync(false);},700);
  window.addEventListener('focus',function(){sync(true);});
  sync(true);
  console.info('[VLI Horse 23.2] Legacy and expanded mapping preserved. Start diagnostics: VLI_PC_HORSE_RECOVERY_232.status()');
})();
