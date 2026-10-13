/* VLI V17 read-only runtime audit */
(function(){
 'use strict';
 var report=function(){
   var j=window.JX||{},factions=Array.isArray(j.factions)?j.factions:[],skills=j.skills||{},fx=window.JFX||{},pc=window.VLI_PC_SKILL_V16||{};
   var items=[];
   factions.forEach(function(f){
     (f.skills||[]).forEach(function(id){var s=skills[id];if(!s||s.req!==120&&s.req!==150)return;
       var v=fx.f&&fx.f[id],m=v&&fx.m&&fx.m[v.c],paths=[m&&m.fly&&m.fly.f,m&&m.hit&&m.hit.f].filter(Boolean);
       items.push({faction:f.n,id:id,level:s.req,name:s.n,icon:s.ic,
         effectDefined:!!v,fxId:v&&v.c||null,atlasPaths:paths,
         usingPCAtlas:paths.some(function(p){return /\/pc-v16\//.test(p);}),
         iconPcVerified:false,adapted:!!s.vliV17Adapted});
     });
   });
   var hoa=factions.find(function(f){return f.key==='huashan';});
   var g=window.VLIHighGear130;
   var g130=g&&g.catalogue?g.catalogue.filter(function(e){return e.schoolId===10;}):[];
   return {version:'17.0',counts:{factions:factions.filter(function(f){return f.skills&&f.skills.length;}).length,
      skill120:items.filter(function(r){return r.level===120;}).length,
      skill150:items.filter(function(r){return r.level===150;}).length,
      huashanSkills:hoa?(hoa.skills||[]).length:0,huashan130Gear:g130.length,
      pcMappedSkillCount:items.filter(function(r){return r.usingPCAtlas;}).length},
      pcRuntime:{enabled:!!pc.enabled,effects:pc.effects||0,missing:(pc.missing||[]).slice()},
      remarks:'PC exactness is NOT established by presence of files. Original 10 factions unchanged; Hoa Son skill properties are H5 adaptations.',items:items};
 };
 window.VLI_V17_AUDIT={version:'17.0',run:report};
})();
