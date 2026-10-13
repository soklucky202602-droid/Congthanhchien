/* VLI V17.1: map ONLY verified VNG publisher PC guide icons after local assets load. */
(function(){
 'use strict';
 var j=window.JX||{},skills=j.skills||{},ids=[780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 798, 799];
 var state={version:'17.1',totalOfficialReferences:ids.length,loadedIds:[],missingIds:[],
   pendingIds:ids.slice(),iconFor120Unverified:797,source:'VNG PC Hoa Son guide; official image references, not original SPR extraction'};
 window.VLI_HUASHAN_PC_ICONS_V17_1=state;
 ids.forEach(function(id){
   var sk=skills[id];if(!sk||sk.f!=='huashan'){state.missingIds.push(id);return;}
   var proposed='img/s/vli-hs-pc-'+id+'.png',img=new Image();
   img.onload=function(){
     if(img.naturalWidth<15||img.naturalHeight<15){state.missingIds.push(id);return;}
     if(sk.ic===proposed)return;
     sk.ic=proposed;state.loadedIds.push(id);
     try{if(typeof S!=='undefined'&&S&&S.fac==='huashan'){
       if(typeof refresh==='function')refresh();if(typeof renderPad==='function')renderPad();
     }}catch(e){}
   };
   img.onerror=function(){state.missingIds.push(id);};
   img.src=proposed;
 });
})();
