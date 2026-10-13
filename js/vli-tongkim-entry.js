/* Independent, visible battle-entry shortcut for both desktop U20 and mobile UI.
 * All controls call the pre-existing offline Tống Kim entry modal.
 */
'use strict';
(function(){
  const open=()=>{
    if(typeof NET_LOCAL!=='undefined' && NET_LOCAL!==true)return;
    if(typeof vliTkOpen==='function')return vliTkOpen();
    if(typeof tkOpenModal==='function')return tkOpenModal();
    if(typeof toast==='function')toast('Chiến trường Tống Kim chưa được khởi tạo.');
  };
  const btn=(id,label)=>{
    const b=document.createElement('button');b.id=id;b.type='button';
    b.setAttribute('aria-label','Tham gia chiến trường Tống Kim offline');
    b.title='Chiến trường Tống Kim · Đại Tống / Đại Kim · cấp 20+';
    const i=document.createElement('img');i.src='ui/tk_flag.svg';i.alt='';i.width=24;i.height=24;
    b.append(i,document.createTextNode(label));b.addEventListener('click',open);return b;
  };
  const mount=()=>{
    const top=document.getElementById('tkBtn');
    if(top&&!top.querySelector('img')){top.textContent='';const i=document.createElement('img');i.src='ui/tk_flag.svg';i.width=20;i.height=20;i.alt='';top.append(i,document.createTextNode('Tống Kim'));}
    if(!document.getElementById('vli-tk-fab'))document.body.appendChild(btn('vli-tk-fab','Tống Kim'));
  };
  const dock=()=>{
    const menu=document.getElementById('u20menu');if(!menu)return false;
    if(!document.getElementById('vli-tk-dock')){
      const b=btn('vli-tk-dock','');b.classList.add('u20mi');menu.appendChild(b);
    }
    return true;
  };
  const boot=()=>{
    mount();if(!dock()){let attempts=0;const check=setInterval(()=>{if(dock()||++attempts>=36)clearInterval(check);},250)}
    document.addEventListener('keydown',e=>{
      if(e.altKey&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='t'&&!e.repeat){e.preventDefault();open();}
    });
  };
  window.VLI_TONGKIM_SHORTCUT={open,boot};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
