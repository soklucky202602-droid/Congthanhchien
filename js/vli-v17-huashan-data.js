/* VLI V17 - Hoa Son playable expansion; skill numbers and reused visual icons are offline ADAPTATIONS, not exact PC data. */
(function(){
 'use strict';
 var game=window.JX;
 if(!game||!game.skills||!Array.isArray(game.factions)){console.error('[V17] Data not loaded; Hoa Son disabled');return;}
 var faction=game.factions.find(function(f){return f.key==='huashan';});
 if(!faction){console.error('[V17] Hoa Son faction absent in game data');return;}
 // VNG PC Hoa Son school is Water (Thuy); preserve original faction ID and element.
 faction.id=10; faction.series=2; faction.n='Hoa Sơn phái';
 var ids=[];
 var trip=function(start,step,count){return Array.from({length:count},function(_,i){return [Math.round(start+i*step),0,0];});};
 var scalar=function(start,step,count){return Array.from({length:count},function(_,i){return Math.round(start+i*step);});};
 var records=[{"id":780,"name":"Bạch Hồng Quán Nhật","level":10,"type":"atk","sword":true,"eqt":0,"form":1,"damage":"physics","icon":"img/s/773.png","fx":142,"fxForm":1,"fxCount":1},{"id":781,"name":"Thanh Vân Tống Sảng","level":10,"type":"atk","sword":false,"eqt":-2,"form":0,"damage":"cold","icon":"img/s/764.png","fx":146,"fxForm":1,"fxCount":1},{"id":782,"name":"Kiếm Tông Tổng Quyết","level":10,"type":"passive","sword":true,"eqt":0,"form":7,"damage":"physbuff","icon":"img/s/775.png","fx":null,"fxForm":0,"fxCount":0},{"id":783,"name":"Long Nhiễu Thân","level":10,"type":"aura","sword":false,"eqt":-2,"form":7,"damage":"manabuff","icon":"img/s/765.png","fx":null,"fxForm":0,"fxCount":0},{"id":784,"name":"Dưỡng Ngô Kiếm Pháp","level":20,"type":"passive","sword":true,"eqt":0,"form":7,"damage":"physbuff","icon":"img/s/763.png","fx":null,"fxForm":0,"fxCount":0},{"id":785,"name":"Hải Nạp Bách Xuyên","level":20,"type":"passive","sword":false,"eqt":-2,"form":7,"damage":"manabuff","icon":"img/s/710.png","fx":null,"fxForm":0,"fxCount":0},{"id":786,"name":"Kim Nhạn Hoành Không","level":30,"type":"atk","sword":true,"eqt":0,"form":1,"damage":"physics","icon":"img/s/773.png","fx":147,"fxForm":1,"fxCount":3},{"id":787,"name":"Long Huyền Kiếm Khí","level":30,"type":"atk","sword":false,"eqt":0,"form":1,"damage":"cold","icon":"img/s/766.png","fx":142,"fxForm":1,"fxCount":2},{"id":788,"name":"Hi Di Kiếm Pháp","level":40,"type":"passive","sword":true,"eqt":0,"form":7,"damage":"physbuff","icon":"img/s/774.png","fx":null,"fxForm":0,"fxCount":0},{"id":789,"name":"Khí Chấn Sơn Hà","level":40,"type":"buff","sword":false,"eqt":-2,"form":7,"damage":"defbuff","icon":"img/s/716.png","fx":null,"fxForm":0,"fxCount":0},{"id":790,"name":"Thiên Thân Đảo Huyền","level":50,"type":"atk","sword":true,"eqt":0,"form":6,"damage":"physics","icon":"img/s/753.png","fx":186,"fxForm":6,"fxCount":3},{"id":791,"name":"Khí Quán Trường Hồng","level":50,"type":"atk","sword":false,"eqt":0,"form":1,"damage":"cold","icon":"img/s/767.png","fx":146,"fxForm":1,"fxCount":3},{"id":792,"name":"Huyền Nhãn Vân Yên","level":60,"type":"buff","sword":false,"eqt":-2,"form":7,"damage":"defbuff","icon":"img/s/765.png","fx":null,"fxForm":0,"fxCount":0},{"id":793,"name":"Ma Vân Kiếm Khí","level":60,"type":"atk","sword":false,"eqt":0,"form":6,"damage":"cold","icon":"img/s/764.png","fx":186,"fxForm":6,"fxCount":4},{"id":794,"name":"Thương Tùng Nghênh Khách","level":60,"type":"atk","sword":true,"eqt":0,"form":1,"damage":"physics","icon":"img/s/772.png","fx":147,"fxForm":1,"fxCount":4},{"id":795,"name":"Đoạt Mệnh Liên Hoàn Tam Tiên Kiếm","level":90,"type":"atk","sword":true,"eqt":0,"form":1,"damage":"physics","icon":"img/s/773.png","fx":175,"fxForm":1,"fxCount":3},{"id":796,"name":"Phá Thạch Phá Ngọc","level":90,"type":"atk","sword":false,"eqt":-2,"form":6,"damage":"cold","icon":"img/s/764.png","fx":186,"fxForm":6,"fxCount":4},{"id":797,"name":"Độc Cô Cửu Kiếm","level":120,"type":"passive","sword":true,"eqt":0,"form":7,"damage":"physbuff","icon":"img/s/713.png","fx":null,"fxForm":0,"fxCount":0},{"id":798,"name":"Cửu Kiếm Hợp Nhất","level":150,"type":"atk","sword":true,"eqt":0,"form":1,"damage":"physics","icon":"img/s/773.png","fx":175,"fxForm":1,"fxCount":9},{"id":799,"name":"Thần Quang Toàn Nhiễu","level":150,"type":"atk","sword":false,"eqt":-2,"form":6,"damage":"cold","icon":"img/s/764.png","fx":186,"fxForm":6,"fxCount":6}];
 records.forEach(function(spec){
   var id=spec.id; var level=spec.level; var type=spec.type;
   if(game.skills[id]&&game.skills[id].f!=='huashan'){throw new Error('[V17] Skill ID '+id+' belongs to an existing faction');}
   var max=20,attr={};
   var attack=type==='atk';
   if(attack){
     var k=level>=150?2.5:level>=90?1.9:level>=50?1.35:1;
     if(spec.damage==='physics'){
       attr.physicsenhance_p=trip(Math.round((55+level*2)*k),Math.round((4+level/6)*k),max);
       attr.physicsdamage_v=Array.from({length:max},function(_,i){return [Math.round((45+level*3+i*18)*k),0,Math.round((95+level*5+i*30)*k)];});
     }else{
       attr.colddamage_v=Array.from({length:max},function(_,i){return [Math.round((70+level*5+i*18)*k),0,Math.round((135+level*8+i*30)*k)];});
       attr.freeze_p=trip(7,1,max);
     }
     attr.skill_attackradius=[level>=150?500:level>=90?440:level>=50?380:300];
     attr.skill_cost_v=scalar(10+Math.floor(level/6),2,max);
   }else if(type==='passive'){
     if(spec.damage==='physbuff')attr.addphysicsdamage_p=Array.from({length:max},function(_,i){return [10+i*3,-1,0];});
     else attr.manamax_p=trip(5,1,max);
   }else if(type==='aura'){
     attr.manareplenish_v=trip(5,1,max);
     attr.skill_cost_v=scalar(5,1,max);
   }else{
     attr.allres_p=trip(3,1,max);
     attr.skill_cost_v=scalar(12,2,max);
   }
   var sourceNote=level===150?'Tên kỹ năng 150 xác minh theo cẩm nang Võ Lâm PC; chỉ số và animation đang mô phỏng cho H5.':
     level===120?'Tên kỹ năng 120 tham khảo tư liệu PC; cơ chế phản kích nguyên bản chưa tái tạo, đang mô phỏng chỉ số bị động.':
     'Tên chiêu theo cẩm nang Hoa Sơn PC; cơ chế, chỉ số và icon tạm dùng dữ liệu Võ Lâm Idle.';
   var sk={id:id,n:spec.name,d:sourceNote,prop:attack?(spec.damage==='cold'?'Công kích nội công (Băng)':'Kiếm pháp (Ngoại công)'):'Hỗ trợ / nội công',
     f:'huashan',series:2,req:level,learn:String(level),tier:level,max:max,
     style:attack?0:3,melee:attack&&spec.sword?1:0,phys:attack&&spec.damage==='physics'?1:0,
     aura:type==='aura'?1:0,radius:attack?(attr.skill_attackradius[0]):(type==='aura'?220:0),
     form:spec.form,hurt:attack?70:0,enemy:attack?1:0,self:attack?0:1,
     weapon:spec.sword?1:0,eqt:spec.eqt,cost:attack?12:0,wait:attack?5:0,
     ic:spec.icon,noHorse:level>=90?1:0,attr:attr,vliV17Adapted:true};
   game.skills[id]=sk;ids.push(id);
 });
 faction.skills=ids.slice();
 var arts=window.JW&&window.JW.hero;
 // Reuse a pre-existing male sword character as a visible fallback. No PC Hoa Son character sprite was supplied.
 if(arts&&!arts.huashan&&arts.wudang)arts.huashan=Object.assign({},arts.wudang);
 window.VLI_HUASHAN_V17={version:'17.0',playable:true,schoolId:10,series:2,ids:ids,
   provenance:'VNG PC names; offline-adapted mechanics; reused H5 graphics; not a PC-perfect conversion',
   skillsPCVerified:false,avatarPCVerified:false,iconsPCVerified:false};
 console.info('[V17] Hoa Son enabled: '+ids.length+' skills. Legacy 10 factions and original character saves untouched.');
})();
