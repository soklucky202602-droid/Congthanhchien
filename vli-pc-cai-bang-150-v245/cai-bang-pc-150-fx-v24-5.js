/* VLI V24.5 - sprites of Cai Bang PC 150; visuals only, no gameplay change. */
(function(){
'use strict';
if(window.VLI_CAI_BANG150_PC_FX)return;
const VERSION='24.5.0', SPR={"cast_1073":{"native":{"f":"vli-pc-cai-bang-150-v245/assets/cast_1073_native.webp","n":26,"d":1,"w":150,"h":160,"ax":75.0,"ay":99.0,"ms":35},"fit":{"f":"vli-pc-cai-bang-150-v245/assets/cast_1073_fit.webp","n":26,"d":1,"w":105,"h":112,"ax":52.5,"ay":69.3,"ms":35}},"fly_335":{"native":{"f":"vli-pc-cai-bang-150-v245/assets/fly_335_native.webp","n":1,"d":16,"w":200,"h":200,"ax":100.0,"ay":108.0,"ms":55},"fit":{"f":"vli-pc-cai-bang-150-v245/assets/fly_335_fit.webp","n":1,"d":16,"w":140,"h":140,"ax":70.0,"ay":75.6,"ms":55}},"hit_344":{"native":{"f":"vli-pc-cai-bang-150-v245/assets/hit_344_native.webp","n":6,"d":1,"w":120,"h":130,"ax":56.0,"ay":96.0,"ms":100},"fit":{"f":"vli-pc-cai-bang-150-v245/assets/hit_344_fit.webp","n":6,"d":1,"w":84,"h":91,"ax":39.2,"ay":67.2,"ms":100}},"fly_336":{"native":{"f":"vli-pc-cai-bang-150-v245/assets/fly_336_native.webp","n":1,"d":16,"w":170,"h":170,"ax":87.0,"ay":118.0,"ms":55},"fit":{"f":"vli-pc-cai-bang-150-v245/assets/fly_336_fit.webp","n":1,"d":16,"w":119,"h":119,"ax":60.9,"ay":82.6,"ms":55}},"hit_336":{"native":{"f":"vli-pc-cai-bang-150-v245/assets/hit_336_native.webp","n":15,"d":1,"w":150,"h":140,"ax":75.0,"ay":110.0,"ms":40},"fit":{"f":"vli-pc-cai-bang-150-v245/assets/hit_336_fit.webp","n":15,"d":1,"w":105,"h":98,"ax":52.5,"ay":77.0,"ms":40}}},KEY='vli_cb150_pc_v245_quality';
let quality='fit',enabled=true,installed=false,original=null,attempt=0;
let casts768=0,casts769=0,replacements=0,fallbackCasts=0,errors=0,overflow=0;
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
 for(let i=0;i<5;i++){
   const spread=i-2;
   missile(arr,fly,hit,x+px*spread*3,y+py*spread*3,tx+px*spread*22,ty+py*spread*22,i*.055,345);
 }
 return arr;
}
const API=window.VLI_CAI_BANG150_PC_FX={
 version:VERSION,
 status(){return{version:VERSION,installed,enabled,quality,assetsReady:Object.values(cache[quality]).filter(v=>v.ready).length,
   assetsTotal:5,casts768,casts769,replacements,fallbackCasts,errors,overflow,
   mappedIds:{H5_768:'PC_1073',H5_769:'PC_1074'},
   note:'Uses 5 original SPR. PC event layout/time approximated; second cast sprite missing.'};},
 setEnabled(v){enabled=!!v;return enabled;},
 setQuality(q){if(q!=='fit'&&q!=='native')return false;quality=q;preload(q);
   try{localStorage.setItem(KEY,q);}catch(e){}return q;},
 getQuality(){return quality;},
 async verifyImages(){const q=quality;return Promise.all(Object.entries(SPR).map(([role,variant])=>new Promise(done=>{
    const m=variant[q],im=new Image();
    im.onload=()=>done({role,ok:im.naturalWidth===m.w*m.n&&im.naturalHeight===m.h*m.d,
      width:im.naturalWidth,height:im.naturalHeight});
    im.onerror=()=>done({role,ok:false});im.src=m.f;
 })));}
};
preload(quality);
function install(){
 if(installed)return true;
 if(typeof window.skillFx!=='function')return false;
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
   }catch(e){errors++;console.warn('[V24.5] Cai Bang FX error',e);}
   return result;
 };
 installed=true;
 console.info('[VLI PC Cai Bang 150 V24.5] ready',API.status());
 return true;
}
if(!install()){
 const timer=setInterval(()=>{if(install()||++attempt>40)clearInterval(timer);},250);
}
})();
