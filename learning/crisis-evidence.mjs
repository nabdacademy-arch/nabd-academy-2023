import {escapeHTML as esc} from './core.mjs?v=3';

const params = new URLSearchParams(location.search);
const ar = params.get('lang') !== 'en';
const lang = ar ? 'ar' : 'en';
const t = (a,b) => ar ? a : b;
const el = id => document.getElementById(id);
const archive = params.get('from') === 'archive';
document.documentElement.lang = lang;
document.documentElement.dir = ar ? 'rtl' : 'ltr';
el('language').textContent = t('English','العربية');
params.set('lang', ar ? 'en' : 'ar');
el('language').href = '?' + params;
el('back').href = './#' + (archive ? 'crisis-archive' : 'disease-radar');
el('back').textContent = t('العودة إلى المسار','Return to track');
const names = {DPT:t('الدفتيريا والكزاز والسعال الديكي','Diphtheria, tetanus and pertussis'), MCV:t('الحصبة','Measles')};
const indicators = {DPT:'SH.IMM.IDPT', MCV:'SH.IMM.MEAS'};
const title = t('قاعدة بيانات التحصين','Immunization evidence bank');
el('title').textContent = document.title = title;
el('intro').textContent = t('نسبة الأطفال بعمر 12–23 شهرًا المشمولين بالتطعيم حسب البلد والسنة. كل سجل قراءة سكانية، ولا يقيس عدد الإصابات. افتح تمرين السجل لمقارنته بالسنة السابقة إن توفرت.', 'Coverage among children aged 12–23 months by economy and year. Each record is a population estimate, not a disease case count. Open an exercise to compare consecutive years when available.');
el('country-label').textContent = t('ابحث باسم البلد أو رمزه','Search by economy or code');
el('year-label').textContent = t('السنة','Year');
el('indicator-label').textContent = t('المؤشر','Indicator');
el('prev').textContent = t('السابق','Previous');
el('next').textContent = t('التالي','Next');
el('credits').textContent = t('المصدر: مؤشرات التنمية العالمية، البنك الدولي، استنادًا إلى بيانات منظمة الصحة العالمية واليونيسف.','Source: World Development Indicators, World Bank, using WHO and UNICEF immunization data.');
el('prev').disabled = el('next').disabled = true;

function openBank(series) {
  const regions = new Intl.DisplayNames([lang],{type:'region'});
  const rows = [];
  for (const [code,{iso2,name,values}] of Object.entries(series)) {
    const display = ar && /^[A-Z]{2}$/.test(iso2) ? regions.of(iso2) : name;
    for (const [indicator,years] of Object.entries(values)) {
      for (const [year,value] of Object.entries(years)) {
        rows.push({code, name:display, search:[display,name,code,iso2].join(' ').toLowerCase(), indicator,year,value,prior:years[Number(year)-1]});
      }
    }
  }
  rows.sort((a,b)=>b.year-a.year || a.name.localeCompare(b.name,lang) || a.indicator.localeCompare(b.indicator));
  el('year').add(new Option(t('كل السنوات','All years'),''));
  for (const year of new Set(rows.map(r=>r.year))) el('year').add(new Option(year,year));
  el('indicator').add(new Option(t('كل المؤشرات','All indicators'),''));
  for (const [code,name] of Object.entries(names)) el('indicator').add(new Option(name,code));
  let page = 0;
  const size = 20;
  function show() {
    const query = el('country').value.trim().toLowerCase();
    const matches = rows.filter(r=>r.search.includes(query) && (!el('year').value || r.year===el('year').value) && (!el('indicator').value || r.indicator===el('indicator').value));
    const start = page * size;
    el('status').textContent = t('النتائج','Results') + ' ' + matches.length + ' / ' + rows.length + (matches.length ? ' · ' + (start+1) + '–' + Math.min(start+size,matches.length) : '');
    el('results').innerHTML = matches.slice(start,start+size).map(r=>{
      const difference=r.value-r.prior;
      const discussion=r.prior===undefined ? t('قارن فقط عند توفر قراءة للسنة السابقة. الغياب لا يعني صفرًا.','Compare only when the previous year has a reading. Missing is not zero.') : t('التغطية في السنة السابقة','Previous year coverage')+' '+r.prior+'%. '+t('التغيّر بالنقاط المئوية','Change in percentage points')+' '+(difference>0?'+':'')+difference+'.';
      return `<article><strong>${esc(r.name)} · ${r.year} · ${esc(names[r.indicator])}</strong><p>${r.value}% · <a class="quiet" href="https://data.worldbank.org/indicator/${indicators[r.indicator]}?locations=${encodeURIComponent(r.code)}">${t('المصدر','Source')}</a></p><details><summary>${t('تمرين: كيف تغيّرت التغطية عن السنة السابقة؟','Exercise: How did coverage change from the previous year?')}</summary><p>${esc(discussion)}</p></details></article>`;
    }).join('') || t('لا توجد قراءات مطابقة.','No matching readings.');
    el('prev').disabled=page===0;
    el('next').disabled=start+size>=matches.length;
  }
  for(const id of ['year','indicator','country']) el(id).addEventListener('input',()=>{page=0;show()});
  el('prev').onclick=()=>{page--;show()};
  el('next').onclick=()=>{page++;show()};
  show();
}
const retry = document.createElement('button');
retry.type = 'button';
retry.className = 'quiet';
retry.textContent = t('إعادة تحميل السجلات','Retry loading records');
retry.hidden = true;
el('status').after(retry);

let loading = false;
async function loadRecords() {
  if (loading) return;
  loading = true;
  retry.disabled = true;
  el('status').textContent = t('جارٍ تحميل السجلات…','Loading records…');
  try {
    const response = await fetch('./crisis-observations.json');
    if (!response.ok) throw Error();
    const {series} = await response.json();
    openBank(series);
    retry.hidden = true;
    window.removeEventListener('online', loadRecords);
  } catch {
    el('status').textContent = t('تعذّر تحميل السجلات. يمكنك إعادة المحاولة من هنا.', 'Records could not be loaded. You can retry here.');
    retry.hidden = false;
    window.addEventListener('online', loadRecords);
  } finally {
    loading = false;
    retry.disabled = false;
  }
}

retry.addEventListener('click', loadRecords);
await loadRecords();
