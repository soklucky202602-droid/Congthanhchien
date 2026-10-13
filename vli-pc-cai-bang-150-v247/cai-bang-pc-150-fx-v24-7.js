/* VLI V24.7 - Cai Bang PC 150; fix Bong Huynh Luoc Dia row tracking + chat left; no gameplay stat change. */
(function(){
'use strict';
if(window.VLI_CAI_BANG150_PC_FX)return;
const TRACK_MARK='__cb150track';
const VERSION='24.7.0';
// H5 skill 769 was marked eqt=3 (thuong) although PC Cai Bang bong = con, k=2.
const weaponRepair={applied:false,before:null,after:null,note:'Chi sua loai vu khi ky nang 769; khong bo qua yeu cau cap/thuoc tinh.'};
function repairStaffSkill(){
 try{
  if(typeof SK==='undefined'||!SK||!SK[769]||SK[769].f!=='gaibang')return false;
  const skill=SK[769];
  if(weaponRepair.before===null)weaponRepair.before=Number(skill.eqt);
  if(Number(skill.eqt)===3){skill.eqt=2;weaponRepair.applied=true;}
  weaponRepair.after=Number(skill.eqt);
  if(weaponRepair.applied&&typeof R!=='undefined'&&R)R.dirty=true;
  return Number(skill.eqt)===2;
 }catch(e){console.warn('[V24.7] Bong Cai Bang:',e);return false;}
}
repairStaffSkill();
const SPR={"cast_1073":{"native":{"f":"vli-pc-cai-bang-150-v247/assets/cast_1073_native.webp","n":26,"d":1,"w":150,"h":160,"ax":75.0,"ay":99.0,"ms":35},"fit":{"f":"vli-pc-cai-bang-150-v247/assets/cast_1073_fit.webp","n":26,"d":1,"w":105,"h":112,"ax":52.5,"ay":69.3,"ms":35}},"fly_335":{"native":{"f":"vli-pc-cai-bang-150-v247/assets/fly_335_native.webp","n":1,"d":16,"w":200,"h":200,"ax":100.0,"ay":108.0,"ms":55},"fit":{"f":"vli-pc-cai-bang-150-v247/assets/fly_335_fit.webp","n":1,"d":16,"w":140,"h":140,"ax":70.0,"ay":75.6,"ms":55}},"hit_344":{"native":{"f":"vli-pc-cai-bang-150-v247/assets/hit_344_native.webp","n":6,"d":1,"w":120,"h":130,"ax":56.0,"ay":96.0,"ms":100},"fit":{"f":"vli-pc-cai-bang-150-v247/assets/hit_344_fit.webp","n":6,"d":1,"w":84,"h":91,"ax":39.2,"ay":67.2,"ms":100}},"fly_336":{"native":{"f":"vli-pc-cai-bang-150-v247/assets/fly_336_native.webp","n":1,"d":16,"w":170,"h":170,"ax":87.0,"ay":118.0,"ms":55},"fit":{"f":"vli-pc-cai-bang-150-v247/assets/fly_336_fit.webp","n":1,"d":16,"w":119,"h":119,"ax":60.9,"ay":82.6,"ms":55}},"hit_336":{"native":{"f":"vli-pc-cai-bang-150-v247/assets/hit_336_native.webp","n":15,"d":1,"w":150,"h":140,"ax":75.0,"ay":110.0,"ms":40},"fit":{"f":"vli-pc-cai-bang-150-v247/assets/hit_336_fit.webp","n":15,"d":1,"w":105,"h":98,"ax":52.5,"ay":77.0,"ms":40}}},KEY='vli_cb150_pc_v247_quality';
let quality='fit',enabled=true,installed=false,patchedTrack=false,original=null,origStepFx=null,attempt=0;
let casts768=0,casts769=0,replacements=0,fallbackCasts=0,errors=0,overflow=0,trackUpdates=0;
const cache={fit:{},native:{}};
try{if(localStorage.getItem(KEY)==='native')quality='native';}catch(e){}
function spec(role){return SPR[role][quality];}
function preload(q){for(const role of Object.keys(SPR)){
 if(cache[q][role])continue;
 const image=new Image(),entry={image,ready:false,failed:false};
 cache[q][role]=entry;
 image.onload=()=>{entry.ready=image.naturalWidth>0&&image.naturalHeight>0;};
 image.onerror=()=>{entry.failed=true;};
 image.src=SPR[role][q].f;
}}
function ready(sid){return (sid===768?['cast_1073','fly_335','hit_344']:['fly_336','hit_336']).every(role=>cache[quality][role]?.ready);}
function d16(dx,dy){return (Math.round(Math.atan2(-dx,dy)/(Math.PI/8))%16+16)%16;}
function dur(s){return Math.min(1.2,s.ms*s.n/1000);}
function boom(arr,s,x,y,delay){arr.push({k:'boom',s,x,y,t:-(delay||0),life:dur(s),dir:0,__cb150pc:true});}
function missile(arr,s,hit,x,y,tx,ty,delay,speed){
 arr.push({k:'mis',s,hit,x1:x,y1:y,x2:tx,y2:ty,t:-delay,
   life:Math.max(.21,Math.min(.80,Math.hypot(tx-x,ty-y)/speed)),dir:d16(tx-x,ty-y),__cb150pc:true});
}
function trackEndpoint(m){
 const tx=Number.isFinite(+m?.tgt?.x)?+m.tgt.x:+m.x2;
 const ty=Number.isFinite(+m?.tgt?.y)?(+m.tgt.y-14):+m.y2;
 const dx=tx-m.x1,dy=ty-m.y1,len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len,off=+m.trackOff||0;
 return {x:tx+px*off,y:ty+py*off,dir:d16(dx,dy)};
}
function patchTracking(){
 if(patchedTrack)return true;
 if(typeof window.stepFx!=='function')return false;
 origStepFx=window.stepFx;
 window.stepFx=function(fx,dt){
   if(fx&&fx[TRACK_MARK]){
     try{
       const p=trackEndpoint(fx);
       fx.x2=p.x;fx.y2=p.y;fx.dir=p.dir;trackUpdates++;
     }catch(e){errors++;console.warn('[V24.7] track step error',e);}
   }
   return origStepFx.apply(this,arguments);
 };
 patchedTrack=true;
 return true;
}
function dragon(from,to){
 const arr=[],cast=spec('cast_1073'),fly=spec('fly_335'),fire=spec('hit_344');
 const x=+from.x,y=+from.y-20,tx=+to.x,ty=+to.y-14;
 const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,px=-uy,py=ux;
 boom(arr,cast,x,y+14,0);
 missile(arr,fly,fire,x,y,tx,ty,.08,360);
 // PC auxiliary FlySkillId 1103: approximate positions and timing of extra flame columns.
 for(let i=0;i<3;i++){
   const along=i===0?0:i===1?-27:27,across=i===0?0:i===1?-26:26;
   boom(arr,fire,tx+ux*along+px*across,ty+uy*along+py*across,.25+i*.11);
 }
 return arr;
}
function staff(from,to,emitted){
 const arr=[],fly=spec('fly_336'),hit=spec('hit_336');
 const x=+from.x,y=+from.y-20,tx=+to.x,ty=+to.y-14;
 const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len;
 // Missing PC TianRen casting sprite: preserve any pre-existing caster effect.
 const cast=emitted.find(v=>v?.k==='boom'&&Math.abs(v.x-from.x)<40&&Math.abs(v.y-from.y)<50);
 if(cast){arr.push(cast);fallbackCasts++;}
 // Bong Huynh Luoc Dia: row of 6 projectiles, laid ngang like Thien Ha Vo Cau, but still using PC 150 artwork.
 const rays=6,laneStep=18,travel=Math.max(120,Math.min(260,len+42));
 for(let i=0;i<rays;i++){
   const off=(i-(rays-1)/2)*laneStep;
   const sx=x+px*off*0.18,sy=y+py*off*0.18;
   const ex=tx+px*off,ey=ty+py*off;
   arr.push({
     k:'mis',s:fly,hit,x1:sx,y1:sy,x2:ex,y2:ey,t:-(i*.045),
     life:Math.max(.24,Math.min(.74,travel/340)),dir:d16(ex-sx,ey-sy),
     [TRACK_MARK]:true,trackOff:off,tgt:to,__cb150pc:true
   });
 }
 return arr;
}
const API=window.VLI_CAI_BANG150_PC_FX={
 version:VERSION,
 status(){return{version:VERSION,installed,enabled,quality,assetsReady:Object.values(cache[quality]).filter(v=>v.ready).length,
   assetsTotal:5,casts768,casts769,replacements,fallbackCasts,errors,overflow,trackUpdates,
   mappedIds:{H5_768:'PC_1073',H5_769:'PC_1074'},weaponRepair:{...weaponRepair},
   note:'769 now emits 6 horizontal tracking rays; 768 unchanged except prior sprite fixes.'};},
 setEnabled(v){enabled=!!v;return enabled;},
 setQuality(q){if(q!=='fit'&&q!=='native')return false;quality=q;preload(q);
   try{localStorage.setItem(KEY,q);}catch(e){}return q;},
 getQuality(){return quality;},
 async verifyImages(){const q=quality;return Promise.all(Object.entries(SPR).map(([role,variant])=>new Promise(done=>{
    const m=variant[q],im=new Image();
    im.onload=()=>done({role,ok:im.naturalWidth===m.w*m.n&&im.naturalHeight===m.h*m.d,
      width:im.naturalWidth,height:im.naturalHeight});
    im.onerror=()=>done({role,ok:false});im.src=m.f;
 })))}
};
preload(quality);
function install(){
 repairStaffSkill();
 patchTracking();
 if(installed)return true;
 if(typeof window.skillFx!=='function')return false;
 if(typeof window.stepFx!=='function')return false;
 original=window.skillFx;
 window.skillFx=function(from,to,skill){
   const sid=Number(skill?.id);
   if(!enabled||(sid!==768&&sid!==769)||!ready(sid)||
      !Number.isFinite(+from?.x)||!Number.isFinite(+from?.y)||
      !Number.isFinite(+to?.x)||!Number.isFinite(+to?.y))return original.apply(this,arguments);
   let fx=null,start=0;
   try{if(typeof R!=='undefined'&&R&&Array.isArray(R.fx)&&!R.quiet){fx=R.fx;start=fx.length;}}catch(e){}
   if(!fx||start>49)return original.apply(this,arguments);
   const result=original.apply(this,arguments);
   try{
     if(fx!==R.fx)return result;
     const emitted=fx.slice(start);if(!emitted.length)return result;
     const replacement=sid===768?dragon(from,to):staff(from,to,emitted);
     if(start+replacement.length>58){overflow++;return result;}
     fx.splice(start,fx.length-start,...replacement);
     replacements++;if(sid===768)casts768++;else casts769++;
   }catch(e){errors++;console.warn('[V24.7] Cai Bang FX error',e);}
   return result;
 };
 installed=true;
 console.info('[VLI PC Cai Bang 150 V24.7] ready',API.status());
 return true;
}
if(!install()){
 const timer=setInterval(()=>{if(patchTracking()&&install()||++attempt>40)clearInterval(timer);},250);
}
})();
