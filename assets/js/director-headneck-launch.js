/* Floating Head & Neck director-only launcher. No question content in this file. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
(function(){
'use strict';
if(location.hostname!=='nabdacademy-arch.github.io')return;
const dash=document.getElementById('dashboard');if(!dash)return;
const sb=createClient('https://zsmmmljgguycrvyrmakl.supabase.co','sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const sheet=document.createElement('style');
sheet.textContent='#nabd-headneck-fab{position:fixed;bottom:22px;right:22px;z-index:30001;background:linear-gradient(135deg,#054b5b,#072037);border:1px solid #37e1d8;color:#fff;border-radius:21px;padding:14px 19px;box-shadow:0 15px 40px #0008;font:700 14px system-ui;cursor:pointer}#nabd-headneck-fab:hover{transform:translateY(-2px)}#nabd-headneck-fab[hidden],#nabd-headneck-drawer[hidden]{display:none!important}#nabd-headneck-drawer{position:fixed;top:4%;bottom:4%;right:18px;width:min(560px,calc(100vw - 36px));z-index:30002;background:#061625;border:1px solid #2a6977;border-radius:22px;box-shadow:0 20px 95px #000c;overflow:hidden}#nabd-headneck-drawer iframe{display:block;border:0;width:100%;height:100%;background:#061625}#nabd-headneck-close{position:absolute;left:10px;top:12px;z-index:5;padding:6px 12px;border:1px solid #4b8c99;background:#09324a;color:white;border-radius:10px;cursor:pointer}@media(max-width:650px){#nabd-headneck-fab{right:12px;bottom:12px}#nabd-headneck-drawer{top:4px;bottom:4px;right:4px;width:calc(100vw - 8px);border-radius:16px}}';
document.head.append(sheet);
const fab=document.createElement('button');fab.id='nabd-headneck-fab';fab.type='button';fab.hidden=true;fab.textContent='🧠 Head & Neck';
fab.setAttribute('aria-label','Private Head and Neck study bot');
const drawer=document.createElement('div');drawer.id='nabd-headneck-drawer';drawer.hidden=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','NABD Director Anatomy Lab');
const close=document.createElement('button');close.id='nabd-headneck-close';close.type='button';close.textContent='✕';close.setAttribute('aria-label','إغلاق');close.onclick=()=>{drawer.hidden=true;fab.focus()};
const frame=document.createElement('iframe');frame.title='Head and Neck private anatomy lab';frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
drawer.append(frame,close);dash.append(fab,drawer);
fab.onclick=()=>{if(!frame.src)frame.src='director-headneck.html';drawer.hidden=false};
let lastUid='';
async function check(){
try{
const r=await sb.auth.getUser();const u=r?.data?.user;
if(r.error||!u)throw Error('Not signed in');
const p=await sb.rpc('nabd_headneck_owner_access');
if(p.error||p.data!==true)throw Error('Not owner');
lastUid=u.id;fab.hidden=false;
}catch{fab.hidden=true;drawer.hidden=true;frame.removeAttribute('src');lastUid=''}
}
sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){fab.hidden=true;drawer.hidden=true;frame.removeAttribute('src');lastUid=''}else if(event==='SIGNED_IN')setTimeout(check,180)});
setTimeout(check,500);
})();
