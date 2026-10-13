/* VLI V14: register new PC horse models in the stable, avoid choosing a false sprite when riding. */
(function(){
 "use strict";
 if(!window.VLI_PC_HORSE_MODELS) return;
 if(typeof HC_KIND!=='undefined'&&typeof HC_TIERS!=='undefined'){
   let pcTier=HC_TIERS.findIndex(row=>row[0]==='PC mở rộng');
   if(pcTier<0){pcTier=HC_TIERS.length;HC_TIERS.push(['PC mở rộng','#6edcff',1]);}
   for(const m of window.VLI_PC_HORSE_MODELS)HC_KIND[m.k]=pcTier;
   if(typeof HC_ALL!=='undefined')HC_ALL=null;
 }
 if(typeof jxHorseRow==='function'){
   const prev=jxHorseRow;
   jxHorseRow=function(item){
     if(item&&item.d===10&&item.k>=33&&item.k<=75){
       const map=window.VLI_PC_HORSE_EXACT_ROWS||{};
       const row=map[item.k];
       if(Number.isInteger(row)&&typeof JXL!=='undefined'&&typeof S!=='undefined'&&JXL?.tabs?.[S&&S.sex?'f':'m']?.['马中']?.[row])return row;
       return -1; // never show a different horse as though it were this model
     }
     return prev(item);
   };
 }
})();
