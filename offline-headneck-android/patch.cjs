'use strict';
const fs=require('node:fs');
const path=require('node:path');
const source=process.argv[2]||'director-headneck.html';
const output=process.argv[3]||'offline-headneck-android/app/src/main/assets/index.html';
let s=fs.readFileSync(source,'utf8');
const oldStart=s.indexOf('async function ensureAccess(){');
const nextStart=s.indexOf('function top(){',oldStart);
if(oldStart<0||nextStart<0)throw Error('Original Head & Neck source format changed');
s=s.replace('<script type="module">','<script>');
s=s.replace(/import \{createClient\} from '[^']+';\s*const sb=createClient\([^\n]+;\s*/,"const BANK_KEY='nabd-headneck-offline-private-bank-v1';\nconst PROGRESS_KEY='nabd-headneck-offline-progress-v1';\n");
const localFuncs=[
"async function ensureAccess(){",
"  try {",
"    owner={id:'device-local'};",
"    const stored=localStorage.getItem(BANK_KEY);",
"    bank=stored?JSON.parse(stored):null;",
"    items=bank?[...(bank.new||[]),...(bank.original||[]),...(bank.archived||[])]:[];",
"    const saved=localStorage.getItem(PROGRESS_KEY);",
"    progress=saved?JSON.parse(saved):{};",
"    el('gate').hidden=true;el('app').hidden=false;render();",
"    if(!bank)openTab('data');",
"  }catch(e){",
"    put('gate','⚠ Unable to open private offline data: '+String(e.message||e));",
"    el('gate').hidden=false;el('app').hidden=true;",
"  }",
"}",
"async function saveProgress(){",
"  try {localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));}",
"  catch(e){console.warn('Local storage full:',e.message);}",
"}",""
].join('\n');
s=s.slice(0,s.indexOf('async function ensureAccess(){'))+localFuncs+s.slice(s.indexOf('function top(){',oldStart));
const block="const r=await sb.from('nabd_headneck_private_bank').upsert({owner_id:owner.id,payload:data,updated_at:new Date().toISOString()},{onConflict:'owner_id'});\nif(r.error)throw r.error;";
if(!s.includes(block))throw Error('Expected upload block missing');
s=s.replace(block,"localStorage.setItem(BANK_KEY,JSON.stringify(data));");
s=s.split('\n').filter(l=>!l.includes('sb.auth.onAuthStateChange(')).join('\n');
s=s.replace('استورد ملف Head_Neck_Exam_Bank_V2.json مرة واحدة. يُحفظ في قاعدة بيانات محمية بحسابك، لا ضمن ملفات الموقع العامة.','استورد ملف Head_Neck_Exam_Bank_V2.json من هاتفك مرة واحدة؛ سيُحفظ محليًا وتعمل كل الوظائف دون الاتصال بالإنترنت.');
s=s.replace('لن تُعرض الأسئلة للطلاب أو الزوار. الشرح الأصلي متاح حين توجد نسخة مُراجعة؛ بعض أسئلة الصور والمفاتيح التاريخية غير مدققة.','الأسئلة محفوظة على هذا الجهاز فقط. هذا التطبيق مستقل عن تسجيل الدخول للموقع، ولا يرسل بيانات عبر الشبكة. بعض مفاتيح الإجابات التاريخية غير مدققة.');
s=s.replace('مساحة المدير الخاصة • Anatomy III','نسخة التشريح الخاصة • Anatomy III • Offline');
if(s.includes('sb.')||s.includes('cdn.jsdelivr.net')||s.includes('createClient'))throw Error('Online dependency remains in offline source');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,s,'utf8');
console.log('Patched offline Head & Neck source:',output,s.length,'characters');
