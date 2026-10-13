/* VLI V17 - non-destructive visual fallback for NEW Hoa Son skills only. */
(function(){
 'use strict';
 var st=window.VLI_HUASHAN_V17,j=window.JFX;
 if(!st||!j||!j.m||!j.f||!j.s)return;
 var visuals={"780":{"m":142,"form":1,"num":1},"781":{"m":146,"form":1,"num":1},"786":{"m":147,"form":1,"num":3},"787":{"m":142,"form":1,"num":2},"790":{"m":186,"form":6,"num":3},"791":{"m":146,"form":1,"num":3},"793":{"m":186,"form":6,"num":4},"794":{"m":147,"form":1,"num":4},"795":{"m":175,"form":1,"num":3},"796":{"m":186,"form":6,"num":4},"798":{"m":175,"form":1,"num":9},"799":{"m":186,"form":6,"num":6}};
 Object.keys(visuals).forEach(function(id){
   var v=visuals[id];
   if(!j.m[v.m]){console.warn('[V17] fallback JFX atlas missing:',v.m);return;}
   j.s[id]=v.m;
   j.f[id]={form:v.form,num:v.num,c:v.m};
 });
 st.visualsRegistered=Object.keys(visuals).length;
 st.visualsSource='borrowed existing H5 atlases; original Hoa Son PC graphics not yet available';
})();
