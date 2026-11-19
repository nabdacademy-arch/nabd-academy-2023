import {CATALOG} from './content.mjs';
import {PACKS, PRACTICE_KEY, readiness, createBackup, mergeBackup, cleanPractice} from './zero-core.mjs';

const $ = id => document.getElementById(id);
let lang = 'ar';
try {lang = localStorage.getItem('nabd-learning-language') === '"en"' ? 'en' : 'ar';} catch {}
const tr = (ar,en) => lang === 'ar' ? ar : en;
function translate() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $('language').textContent = lang === 'ar' ? 'English' : 'العربية';
  for (const node of document.querySelectorAll('[data-ar][data-en]')) node.textContent = node.dataset[lang];
  $('connection').textContent = navigator.onLine ? tr('متصل','Online') : tr('دون اتصال','Offline');
}
function getProgress() {
  try {return cleanPractice(CATALOG.lessons, JSON.parse(localStorage.getItem(PRACTICE_KEY) || '{}'));} catch {return {};}
}
function showProgress() {
  const progress = getProgress();
  $('practice-count').textContent = tr('سجلات التدريب الموجودة على هذا الجهاز: ','Practice records on this device: ') + Object.keys(progress).length + ' / ' + CATALOG.lessons.length;
}
function baseFor(name) {return new URL(PACKS[name].scope, import.meta.url);}
async function auditPack(name) {
  const spec = PACKS[name], target = $(name+'-status');
  if (!('caches' in window)) {
    target.textContent = tr('هذا المتصفح لا يدعم فحص الذاكرة المحلية.','Cache Storage inspection is unsupported in this browser.');
    return false;
  }
  const names = await caches.keys();
  if (!names.includes(spec.cache)) {
    target.textContent = tr('لم تُحفظ النسخة الحالية من الحزمة.','Current pack version is not saved.');
    return false;
  }
  const cache = await caches.open(spec.cache);
  const base = baseFor(name);
  const present = [];
  for (const asset of spec.assets) {
    if (await cache.match(new URL(asset,base).href, {ignoreSearch:true})) present.push(asset);
  }
  const result = readiness(spec.assets,present);
  target.textContent = result.ready
    ? tr('جاهزة دون إنترنت · ', 'Offline-ready · ') + result.total + '/' + result.total
    : tr('الحزمة ناقصة · ', 'Incomplete pack · ') + result.saved + '/' + result.total +
      tr(' ملف محفوظ. أعد الحفظ عند وجود اتصال.',' files cached. Re-save when online.');
  return result.ready;
}
async function auditAll() {
  $('audit').disabled = true;
  try {
    const statuses = await Promise.all(['learning','atlas'].map(auditPack));
    $('audit-message').textContent = statuses.every(Boolean)
      ? tr('الملفات العامة المطلوبة موجودة في ذاكرة المتصفح. جرّب التصفح دون شبكة للتأكد على جهازك.','All required public files exist in browser cache. Verify by opening pages offline on your device.')
      : tr('ليست كل الحزم جاهزة بعد. لا تعتمد عليها قبل اكتمال الحفظ.','Not all packs are ready. Do not rely on offline access until the saved files are complete.');
  } catch {
    $('audit-message').textContent = tr('تعذّر فحص التخزين. قد يكون محظورًا أو ممتلئًا.','Storage audit failed; access may be blocked or unavailable.');
  } finally {$('audit').disabled = false;}
}
async function waitForInstallation(reg) {
  const worker = reg.installing || reg.waiting;
  if (!worker || worker.state === 'activated') return;
  await Promise.race([
    new Promise((resolve,reject) => {
      const done = () => {
        if (worker.state === 'activated') {worker.removeEventListener('statechange',done);resolve();}
        if (worker.state === 'redundant') {worker.removeEventListener('statechange',done);reject(Error('Worker installation failed'));}
      };
      worker.addEventListener('statechange',done);
      done();
    }),
    new Promise((_,reject)=>setTimeout(()=>reject(Error('Installation timeout')),25000))
  ]);
}
async function savePack(name) {
  const button = $('save-'+name), target = $(name+'-status');
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    target.textContent = tr('يتطلب حفظ الحزم HTTPS ومتصفحًا يدعم Service Worker.','Saving requires HTTPS and Service Worker support.');
    return;
  }
  if (!navigator.onLine) {
    target.textContent = tr('اتصل بالإنترنت أولًا لتنزيل الحزمة.','Connect to the internet first to download the pack.');
    return;
  }
  button.disabled = true;
  target.textContent = tr('جارٍ تنزيل الملفات العامة والتحقق منها…','Downloading and checking public files…');
  try {
    const base = baseFor(name);
    const reg = await navigator.serviceWorker.register(new URL('sw.js',base).href,{scope:base.href});
    await waitForInstallation(reg);
    const ok = await auditPack(name);
    if (!ok) target.textContent += tr(' إذا استمر النقص، حدّث الصفحة وحاول مجددًا.',' If still incomplete, reload and retry.');
  } catch {
    target.textContent = tr('لم يكتمل الحفظ. تأكد من الاتصال والمساحة ثم حاول مجددًا.','Pack installation did not finish. Check network and storage, then retry.');
  } finally {
    button.disabled = false;
    showProgress();
  }
}
function exportPractice() {
  try {
    const payload = createBackup(CATALOG.lessons,getProgress());
    const blob = new Blob([payload],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href=url;a.download='nabd-zero-practice.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('backup-message').textContent = tr('نُسخ ملف نتائج التدريب العام للتنزيل، دون بيانات حساب.','Public practice backup downloaded, without account information.');
  } catch {
    $('backup-message').textContent = tr('تعذّر تجهيز النسخة.','Unable to create backup.');
  }
}
async function importPractice(file) {
  if (!file) return;
  if (file.size > 65536) throw Error('File too large');
  const json = await file.text();
  const {progress,imported} = mergeBackup(CATALOG.lessons,getProgress(),json);
  if (!window.confirm(tr('دمج '+imported+' سجل تدريب على هذا الجهاز فقط؟ لن تُحذف الدرجات الأعلى.','Merge '+imported+' practice records on this device only? Higher scores will be preserved.'))) return false;
  localStorage.setItem(PRACTICE_KEY,JSON.stringify(progress));
  showProgress();
  return true;
}
$('language').addEventListener('click',()=>{lang = lang === 'ar' ? 'en':'ar';try{localStorage.setItem('nabd-learning-language',JSON.stringify(lang));}catch{} translate();showProgress();auditAll();});
$('audit').addEventListener('click',auditAll);
$('save-learning').addEventListener('click',()=>savePack('learning'));
$('save-atlas').addEventListener('click',()=>savePack('atlas'));
$('export').addEventListener('click',exportPractice);
$('import').addEventListener('change',async event=>{
  const input=event.currentTarget;
  try {
    const completed=await importPractice(input.files?.[0]);
    $('backup-message').textContent = completed
      ? tr('استُعيد تقدم التدريب المحلي بنجاح. حدّث مساحة التعلّم إذا كانت مفتوحة بتبويب آخر.','Local practice restored. Reload Learning Space if it is open in another tab.')
      : tr('لم تُجرَ تغييرات على بيانات التدريب.','No practice data changed.');
  } catch {
    $('backup-message').textContent = tr('الملف غير صالح أو لا يطابق نسخة تدريب نبض. لم نغيّر نتائجك.','Invalid or unsupported NABD practice backup. Your progress was not changed.');
  } finally {input.value='';}
});
window.addEventListener('online',()=>{translate();auditAll();});
window.addEventListener('offline',()=>{translate();auditAll();});
window.addEventListener('storage',event=>{if(event.key===PRACTICE_KEY)showProgress();});
translate();showProgress();auditAll();
