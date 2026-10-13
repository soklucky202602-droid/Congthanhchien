/* VLI V17.1 | Hoa Son entry and avatar compatibility; changes ONLY new Hua Son visual/eligibility flags. */
(function(){
 'use strict';
 var report={version:'17.1',ready:false,maleAllowed:false,femaleAllowed:false,
   visualSource:'H5 stand-in art, NOT verified PC Hua Son sprite',changedSaves:false};
 window.VLI_HUASHAN_GENDER_V17_1=report;
 if(!window.JX||!window.VLI_HUASHAN_V17){console.warn('[V17.1] V17 Hua Son data missing or in incorrect load order');return;}
 var hoa=window.JX.factions&&window.JX.factions.find(function(f){return f.key==='huashan';});
 if(!hoa||!(hoa.skills||[]).length){console.warn('[V17.1] Hua Son skills absent; install V17 first');return;}
 try{
   // Hua Son accepts male and female. Never modify restrictions for any other school.
   if(typeof FAC_SEX!=='undefined'&&Object.prototype.hasOwnProperty.call(FAC_SEX,'huashan'))delete FAC_SEX.huashan;
   if(typeof FACTIONS!=='undefined'&&FACTIONS.indexOf(hoa)<0)FACTIONS.push(hoa);
   if(typeof FAC!=='undefined'&&!FAC.huashan)FAC.huashan=hoa;
   report.maleAllowed=typeof facAllowed==='function'?!!facAllowed(hoa,0):false;
   report.femaleAllowed=typeof facAllowed==='function'?!!facAllowed(hoa,1):false;
   report.factionInPlayableList=typeof FACTIONS!=='undefined'&&FACTIONS.indexOf(hoa)>=0;
   report.starter=hoa.starter||780;
   // V17 assigned a copy of Wudang's male avatar to Hua Son for BOTH sexes.
   // Only replace that copied stand-in; NEVER override distinct/real Hua Son artwork.
   var arts=window.JW&&window.JW.hero;
   var male=arts&&(arts.wudang||arts.gaibang),female=arts&&(arts.emei||arts.cuiyan);
   if(arts&&arts.huashan&&male&&female&&arts.huashan.img===male.img){
      var custom=null;
      Object.defineProperty(arts,'huashan',{configurable:true,enumerable:true,
        get:function(){
          if(custom)return custom;
          var sex=0;
          try{
            if(typeof S!=='undefined'&&S&&Number.isInteger(+S.sex))sex=+S.sex;
            else if(typeof NEWC!=='undefined'&&NEWC)sex=+NEWC.sex||0;
          }catch(e){}
          return sex===1?female:male;
        },
        set:function(value){if(value&&value!==male&&value!==female)custom=value;}
      });
      report.genderAwareFallback=true;
   }else{report.genderAwareFallback=false;}
   report.ready=report.maleAllowed&&report.femaleAllowed&&report.factionInPlayableList;
   if(!report.ready)console.error('[V17.1] Hua Son eligibility check failed:',report);
   else console.info('[V17.1] Hua Son male + female are eligible; fallback avatar is H5, not PC.');
 }catch(e){report.error=String(e);console.error('[V17.1] Hua Son compatibility error',e);}
})();
