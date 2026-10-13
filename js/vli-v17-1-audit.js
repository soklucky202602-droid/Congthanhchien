/* VLI V17.1 read-only browser audit: NO save/character edits. */
(function(){
 'use strict';
 function run(){
  var j=window.JX||{},skills=j.skills||{},factions=j.factions||[],all=Object.keys(skills).map(function(k){return skills[k];}).filter(Boolean);
  var high=window.VLIHighGear130,gear=(high&&high.catalogue)||window.VLI_GEAR130_CATALOG||[];
  var hoa=factions.find(function(x){return x.key==='huashan';});
  var gen=window.VLI_HUASHAN_GENDER_V17_1||{},ic=window.VLI_HUASHAN_PC_ICONS_V17_1||{};
  var sk180=all.filter(function(x){return +x.req===180;});
  var gear180=gear.filter(function(x){return x.kind==='gold'&&+x.requiredLevel===180;});
  var hsGear=gear.filter(function(x){return x.kind==='gold'&&+x.schoolId===10;});
  var counts={factions:factions.filter(function(f){return f.skills&&f.skills.length;}).length,
    skill120:all.filter(function(x){return +x.req===120;}).length,
    skill150:all.filter(function(x){return +x.req===150;}).length,
    skill180:sk180.length,huashanSkills:hoa?(hoa.skills||[]).length:0,
    huashanGear130to170:hsGear.filter(function(x){return +x.requiredLevel>=130&&+x.requiredLevel<=170;}).length,
    huashanGear180:hsGear.filter(function(x){return +x.requiredLevel===180;}).length,
    otherSchoolGear180:gear180.filter(function(x){return x.schoolId!==10;}).length,
    officialPcHuashanIconsAvailable:ic.loadedIds?ic.loadedIds.length:0};
  return {version:'17.1',gender:{maleAllowed:!!gen.maleAllowed,femaleAllowed:!!gen.femaleAllowed,
    factionVisible:!!gen.factionInPlayableList,avatarIsOriginalPC:false,visualStandIn:gen.visualSource||''},
    counts:counts,skill180:sk180.map(function(s){return{id:s.id,name:s.n,faction:s.f};}),
    huashanGear180:hsGear.filter(function(x){return +x.requiredLevel===180;}).map(function(x){return {id:x.id,name:x.name};}),
    officialIconRefs:ic.totalOfficialReferences||0,officialIconLoaded:(ic.loadedIds||[]).slice(),
    note:'Skill180 absent in the provided H5/PC-extract skill tables. 257 hashed SPRs do not encode verified skill-to-SPR/180 metadata. NEVER treat gear level 180 as skill level 180.',
    saveRead:false,saveChanged:false};
 }
 window.VLI_V17_1_AUDIT={version:'17.1',run:run};
})();
