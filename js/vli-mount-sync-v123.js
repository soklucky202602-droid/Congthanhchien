/* VLI V12.3 - Non-destructive horse sprite synchronization; only visual mapping. */
"use strict";
window.VLI_MOUNT_K_ROWS={"0":0,"1":4,"2":7,"3":3,"4":6,"6":10,"7":11,"8":12,"9":13,"10":3,"11":15,"12":6,"13":17,"14":18,"15":19,"16":20,"17":21,"18":22,"19":11,"20":11,"21":11,"22":23,"23":24,"24":25,"25":26,"26":27,"27":28,"28":29,"29":3,"30":11,"31":13,"32":17};
window.VLI_MOUNT_NAMES5={"Ô Vân Đạp Tuyết":5,"Xích Thố":13,"Tuyệt ảnh":3,"Tuyệt Ảnh":3,"Đích Lô":6,"Chiếu Dạ Ngọc Sư Tử":11};
window.VLI_MOUNT_VARIANTS=[
 {row:27,k:26,sourceRow:26,name:"Dương Sa"},
 {row:28,k:27,sourceRow:26,name:"Ngự Phong"},
 {row:29,k:28,sourceRow:17,name:"Truy Điện"}
];
window.VLI_MOUNT_SPRITE_VERSION="12.3";
(function(){
 const rowMap=window.VLI_MOUNT_K_ROWS,names5=window.VLI_MOUNT_NAMES5,vars=window.VLI_MOUNT_VARIANTS;
 const partKinds=[["马前","hh"],["马中","hb"],["马后","ht"]];
 let done=false,retries=0,timer=null;
 function install(){
  if(done)return true;
  const j=window.JXLOOK;
  if(!j||!j.tabs||!j.tabs.m||!j.tabs.f||!j.sheets)return false;
  for(const v of vars){
   for(const [part,pcode] of partKinds){
    const src=j.tabs.m[part]&&j.tabs.m[part][v.sourceRow];
    if(!src||!Object.keys(src).length)return false;
    for(const gender of ['m','f']){
     if(!j.tabs[gender][part])return false;
    }
    const destM={},destF={};
    for(const [act,oldSheet] of Object.entries(src)){
     const suffix=oldSheet.slice(oldSheet.lastIndexOf('_')+1);
     const nm='vli_mount_'+v.row+'_'+pcode+'_'+suffix;
     const dim=j.sheets['m/'+oldSheet];
     if(!dim)return false;
     destM[act]=nm;destF[act]='m:'+nm;
     j.sheets['m/'+nm]=dim.slice();
    }
    j.tabs.m[part][v.row]=destM;
    j.tabs.f[part][v.row]=destF;
   }
  }
  try{
   if(typeof JX_K_ROW!=='undefined'){
    for(const [k,row] of Object.entries(rowMap))JX_K_ROW[k]=row;
   }
   if(typeof JX_K5_ROW!=='undefined'){
    for(const [name,row] of Object.entries(names5))JX_K5_ROW[name]=row;
   }
   if(typeof JX_HN_ROW!=='undefined'){
    for(const [name,row] of Object.entries(names5))JX_HN_ROW[name]=row;
    Object.assign(JX_HN_ROW,{"Tuyệt Địa":3,"Đằng Vụ":6,"Dương Sa":27,"Ngự Phong":28,"Truy điện":29,"Truy Điện":29,"Lưu Tinh":3});
   }
   if(typeof JXL!=='undefined')JXL=j;
  }catch(e){console.warn('[VLI Mount] mapping warning',e);}
  done=true;
  window.VLI_MOUNT_SYNC_READY=true;
  try{
   if(typeof R!=='undefined'&&R&&typeof S!=='undefined'&&S&&S.fac&&typeof jxSetup==='function'){
    R.jx=jxSetup();if(R.jx&&typeof jxPreload==='function')jxPreload();
   }
  }catch(e){console.warn('[VLI Mount] initial refresh warning',e)}
  return true;
 }
 function boot(){
  if(install())return;
  timer=setInterval(function(){
   if(install()||++retries>100){clearInterval(timer);if(!done)console.warn('[VLI Mount] JXLOOK not loaded')}
  },150);
 }
 boot();
 window.VLI_MOUNT_ROW_FOR=function(item){
  if(!item)return -1;
  const name=(item.n||'').replace(/\s+\d+$/,'');
  if(+item.k===5&&Object.prototype.hasOwnProperty.call(names5,name))return names5[name];
  return Object.prototype.hasOwnProperty.call(rowMap,+item.k)?rowMap[+item.k]:-1;
 };
})();

window.VLI_MOUNT_SOURCE_AUDIT = {
  version: "12.3",
  publicReference: "https://volamidle.pages.dev/jxlook.js",
  originalRows: 25,
  distinctBodySheets: 23,
  catalogueNames: 54,
  syntheticRows: [27,28,29],
  note: "Only 25 available ride rows from public table; color variants are NOT original video/site assets."
};
