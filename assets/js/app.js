const i18n={
 en:{"nav.home":"Home","nav.courses":"Courses","nav.research":"Research","nav.verify":"Verify","nav.achievements":"Achievements","nav.about":"About","nav.login":"Student Login","hero.eyebrow":"Medical education • Research • Verification","hero.title":"Learn. Research. Verify. Grow.","hero.text":"A bilingual digital academy for medical learning, student development, research projects, and verifiable certificates.","hero.explore":"Explore Courses","hero.verify":"Verify Certificate","hero.bilingual":"Arabic & English","hero.qr":"QR verification","hero.portal":"Student portal","hero.cardTitle":"NABD Digital Platform v2","hero.cardText":"Built for courses, certificates, research, students, and academy administration.","metrics.courses":"Courses","metrics.research":"Research Projects","metrics.verify":"Verification","courses.eyebrow":"Learning","courses.title":"Medical Courses","courses.text":"Structured theoretical medical learning with completion certificates.","research.eyebrow":"NABD Research Center","research.title":"Research & Scientific Projects","research.text":"Transparent project pages that distinguish protocols, ongoing studies, and completed work.","verify.eyebrow":"Certificate Verification","verify.title":"Check a NABD certificate","verify.text":"Enter the certificate ID exactly as shown on the certificate.","verify.button":"Verify","verify.empty":"Verification result will appear here.","achievements.eyebrow":"Milestones","achievements.title":"Achievements & Recognition","achievements.text":"Only documented awards and recognitions are published here.","achievements.pendingTitle":"Evidence-first publishing","achievements.pendingText":"Awards are added after verification of the certificate, letter, or official correspondence.","about.eyebrow":"About NABD","about.title":"Accessible medical learning with verifiable outcomes","about.text":"NABD Academy for Medical Sciences is an educational initiative focused on theoretical medical courses, research development, and transparent certificates of completion.","about.transparency":"Transparency","about.disclaimer":"Certificates are certificates of completion and do not represent a university degree or governmental accreditation unless explicitly stated and documented.","cta.title":"Ready to join a course?","cta.text":"Use the registration form or contact the academy through WhatsApp.","cta.form":"Registration Form","cta.whatsapp":"WhatsApp","footer.tagline":"Learn • Research • Verify • Grow","footer.policies":"Policies & Transparency","footer.portal":"Student Portal","footer.admin":"Admin","footer.contact":"Official contact channels"},
 ar:{"nav.home":"الرئيسية","nav.courses":"الدورات","nav.research":"الأبحاث","nav.verify":"التحقق","nav.achievements":"الإنجازات","nav.about":"من نحن","nav.login":"دخول الطالب","hero.eyebrow":"تعليم طبي • بحث علمي • تحقق من الشهادات","hero.title":"تعلّم • ابحث • تحقّق • تطوّر","hero.text":"منصة أكاديمية رقمية ثنائية اللغة للتعليم الطبي، تطوير الطلاب، المشاريع البحثية، والشهادات القابلة للتحقق.","hero.explore":"استكشف الدورات","hero.verify":"تحقق من شهادة","hero.bilingual":"العربية والإنجليزية","hero.qr":"تحقق عبر QR","hero.portal":"بوابة الطالب","hero.cardTitle":"منصة نبض الرقمية v2","hero.cardText":"مصممة للدورات والشهادات والأبحاث والطلاب وإدارة الأكاديمية.","metrics.courses":"دورات","metrics.research":"مشاريع بحثية","metrics.verify":"تحقق","courses.eyebrow":"التعليم","courses.title":"الدورات الطبية","courses.text":"تعليم طبي نظري منظم مع شهادات إتمام.","research.eyebrow":"مركز نبض للأبحاث","research.title":"الأبحاث والمشاريع العلمية","research.text":"صفحات شفافة تبيّن ما إذا كان المشروع بروتوكولًا أو دراسة جارية أو عملاً مكتملًا.","verify.eyebrow":"التحقق من الشهادات","verify.title":"تحقق من شهادة نبض","verify.text":"أدخل رقم الشهادة كما يظهر عليها تمامًا.","verify.button":"تحقق","verify.empty":"ستظهر نتيجة التحقق هنا.","achievements.eyebrow":"محطات وإنجازات","achievements.title":"الإنجازات والتكريمات","achievements.text":"لا يتم نشر أي جائزة أو تكريم إلا بعد توثيقه.","achievements.pendingTitle":"النشر القائم على الدليل","achievements.pendingText":"تضاف الجوائز بعد التحقق من الشهادة أو الخطاب أو المراسلات الرسمية.","about.eyebrow":"عن نبض","about.title":"تعليم طبي متاح بنتائج قابلة للتحقق","about.text":"أكاديمية نبض للعلوم الطبية مبادرة تعليمية تركز على الدورات الطبية النظرية، تطوير البحث العلمي، وشهادات الإتمام الشفافة.","about.transparency":"الشفافية","about.disclaimer":"شهاداتنا هي شهادات إتمام وليست درجات جامعية أو اعتمادًا حكوميًا إلا إذا ذُكر ذلك صراحة مع توثيق رسمي.","cta.title":"جاهز للانضمام إلى دورة؟","cta.text":"استخدم نموذج التسجيل أو تواصل عبر واتساب.","cta.form":"نموذج التسجيل","cta.whatsapp":"واتساب","footer.tagline":"تعلّم • ابحث • تحقّق • تطوّر","footer.policies":"السياسات والشفافية","footer.portal":"بوابة الطالب","footer.admin":"الإدارة","footer.contact":"قنوات التواصل الرسمية"}
};

let lang=localStorage.getItem('nabd_lang')||'en';

const $=s=>document.querySelector(s);

async function loadJSON(p){
  const r=await fetch(p);
  if(!r.ok)throw new Error('Failed to load '+p);
  return r.json();
}

function esc(v=''){
  return String(v).replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

let courses=[];
let research=[];
let sampleCertificates=[];

async function loadPublicData(){
  if(window.nabdSupabase){
    const [{data:c,error:ce},{data:r,error:re}]=await Promise.all([
      window.nabdSupabase
        .from('courses')
        .select('*')
        .eq('status','active')
        .order('created_at'),

      window.nabdSupabase
        .from('research_projects')
        .select('*')
        .eq('published',true)
        .order('project_no')
    ]);

    if(!ce&&c){
      courses=c.map(x=>({
        ...x,
        id:x.slug,
        level:x.level_en,
        status:x.status
      }));
    }

    if(!re&&r){
      research=r.map(x=>({
        id:x.slug,
        project_no:x.project_no,
        title:x.title_en,
        subtitle:x.subtitle_en,
        field:x.field,
        status:x.status,
        summary:x.summary_en,
        title_ar:x.title_ar,
        summary_ar:x.summary_ar
      }));
    }
  }

  if(!courses.length){
    courses=await loadJSON('data/courses.json');
  }

  if(!research.length){
    research=await loadJSON('data/research.json');
  }

  try{
    sampleCertificates=await loadJSON('data/certificates.sample.json');
  }catch(_){
    sampleCertificates=[];
  }
}

function applyLang(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.dataset.i18n;
    if(i18n[lang]?.[k])el.textContent=i18n[lang][k];
  });

  const lb=$('#langBtn');
  if(lb)lb.textContent=lang==='en'?'العربية':'English';

  renderDynamic();
  renderContact();
}

function renderDynamic(){
  const cg=$('#courseGrid');

  if(cg){
    cg.innerHTML=courses.map(c=>`
      <article class="course-card">
        <span class="badge">${esc(c.status)}</span>
        <h3>${esc(lang==='ar'?(c.title_ar||c.title_en):c.title_en)}</h3>
        <p>${esc(lang==='ar'?(c.description_ar||c.description_en):c.description_en)}</p>
        <div class="meta">
          <span>${esc(c.hours)} hrs</span>
          <span>${esc(lang==='ar'?(c.level_ar||c.level):c.level_en||c.level||'')}</span>
        </div>
        <div class="card-actions">
          <a class="text-link" href="course.html?id=${encodeURIComponent(c.slug||c.id)}">
            ${lang==='ar'?'التفاصيل':'Details'}
          </a>
          <a class="text-link" href="enroll.html?course=${encodeURIComponent(c.slug||c.id)}">
            ${lang==='ar'?'التسجيل →':'Enroll →'}
          </a>
        </div>
      </article>
    `).join('');
  }

  const rg=$('#researchGrid');

  if(rg){
    rg.innerHTML=research.map(r=>`
      <article class="research-card">
        <div class="project-no">${esc(r.project_no||'')}</div>
        <div>
          <span class="badge">${esc(r.status)}</span>
          <h3>${esc(lang==='ar'?(r.title_ar||r.title):r.title)}</h3>
          <h4>${esc(r.subtitle||'')}</h4>
          <p>${esc(lang==='ar'?(r.summary_ar||r.summary):r.summary)}</p>
          <div class="meta">
            <span>${esc(r.field||'')}</span>
          </div>
          <a class="text-link" href="research.html?id=${encodeURIComponent(r.slug||r.id)}">
            ${lang==='ar'?'عرض المشروع →':'View project →'}
          </a>
        </div>
      </article>
    `).join('');
  }

  const cc=$('#courseCount');
  if(cc)cc.textContent=courses.length;

  const rc=$('#researchCount');
  if(rc)rc.textContent=research.length;
}

function renderContact(){
  const cfg=window.NABD_CONFIG||{};
  const wa=cfg.contact?.whatsapp;

  const a=$('#whatsappCta');

  if(a&&wa&&wa!=='TO_CONFIRM'){
    a.classList.remove('disabled');
    a.removeAttribute('aria-disabled');
    a.href=`https://wa.me/${wa.replace(/\D/g,'')}`;
  }

  const box=$('#contactBlock');

  if(box){
    const lines=[];

    if(cfg.contact?.email&&cfg.contact.email!=='TO_CONFIRM'){
      lines.push(
        `<a href="mailto:${esc(cfg.contact.email)}">${esc(cfg.contact.email)}</a>`
      );
    }

    if(wa&&wa!=='TO_CONFIRM'){
      lines.push(
        `<a href="https://wa.me/${wa.replace(/\D/g,'')}">WhatsApp: ${esc(wa)}</a>`
      );
    }

    if(cfg.contact?.telegram&&cfg.contact.telegram!=='TO_CONFIRM'){
      lines.push(
        `<span>Telegram: ${esc(cfg.contact.telegram)}</span>`
      );
    }

    box.innerHTML=lines.join('<br>')||i18n[lang]['footer.contact'];
  }
}

async function verify(id){
  const box=$('#verifyResult');

  if(!id)return;

  box.className='verify-result empty';
  box.textContent=lang==='ar'?'جاري التحقق…':'Checking…';

  let hit=null;

  if(window.nabdSupabase){
    const {data,error}=await window.nabdSupabase.rpc(
      'verify_certificate',
      {input_certificate_id:id}
    );

    if(!error&&Array.isArray(data)&&data.length){
      hit=data[0];
    }
  }else{
    hit=sampleCertificates.find(
      x=>x.certificate_id.toLowerCase()===id.toLowerCase()
    );
  }

  if(!hit){
    box.className='verify-result invalid';
    box.innerHTML=`
      <strong>
        ${lang==='ar'?'لم يتم العثور على الشهادة':'Certificate not found'}
      </strong>
      <p>
        ${lang==='ar'?'تحقق من الرقم أو تواصل مع الأكاديمية.':'Check the ID or contact the academy.'}
      </p>
    `;
    return;
  }

  const valid=String(hit.status).toLowerCase()==='valid';

  const verificationUrl=
    `${location.origin}${location.pathname}?certificate=${encodeURIComponent(hit.certificate_id)}#verify`;

  box.className=`verify-result ${valid?'valid':'invalid'}`;

  box.innerHTML=`
    <span class="status-pill">
      ${valid?'VALID ✓':'REVOKED'}
    </span>

    <h3>${esc(hit.public_name||hit.student_name)}</h3>

    <p>
      <strong>${esc(hit.course_title||hit.course)}</strong>
    </p>

    <dl>
      <div>
        <dt>ID</dt>
        <dd>${esc(hit.certificate_id)}</dd>
      </div>

      <div>
        <dt>${lang==='ar'?'الساعات':'Hours'}</dt>
        <dd>${esc(hit.hours)}</dd>
      </div>

      <div>
        <dt>${lang==='ar'?'تاريخ الإصدار':'Issue date'}</dt>
        <dd>${esc(hit.issue_date)}</dd>
      </div>
    </dl>

    <div id="verifyQr" class="qr-box"></div>

    <button class="text-btn" id="copyVerifyLink">
      ${lang==='ar'?'نسخ رابط التحقق':'Copy verification link'}
    </button>
  `;

  if(window.QRCode){
    new QRCode(
      document.getElementById('verifyQr'),
      {
        text:verificationUrl,
        width:128,
        height:128
      }
    );
  }

  const copy=$('#copyVerifyLink');

  if(copy){
    copy.onclick=async()=>{
      await navigator.clipboard.writeText(verificationUrl);
      copy.textContent=lang==='ar'?'تم النسخ ✓':'Copied ✓';
    };
  }
}

document.addEventListener('DOMContentLoaded',async()=>{

  try{
    await loadPublicData();
  }catch(e){
    console.error(e);
  }

  applyLang();

  const year=$('#year');

  if(year){
    year.textContent=new Date().getFullYear();
  }

  const lb=$('#langBtn');

  if(lb){
    lb.onclick=()=>{
      lang=lang==='en'?'ar':'en';
      localStorage.setItem('nabd_lang',lang);
      applyLang();
    };
  }

  const mb=$('#menuBtn');

  if(mb){
    mb.onclick=()=>{
      $('#mainNav').classList.toggle('open');
    };
  }

  const vf=$('#verifyForm');

  if(vf){
    vf.onsubmit=e=>{
      e.preventDefault();
      verify($('#certificateId').value.trim());
    };
  }

  const preset=
    new URLSearchParams(location.search).get('certificate');

  if(preset&&$('#certificateId')){
    $('#certificateId').value=preset;
    setTimeout(()=>verify(preset),50);
  }
});
