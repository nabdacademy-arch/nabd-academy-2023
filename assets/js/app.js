const i18n={
  en:{
    "nav.home":"Home",
    "nav.courses":"Courses",
    "nav.research":"Research",
    "nav.verify":"Verify",
    "nav.achievements":"Achievements",
    "nav.about":"About",
    "nav.login":"Student Login",

    "hero.eyebrow":"Medical Education • Research • Verification",
    "hero.title":"Learn. Research. Verify. Grow.",
    "hero.text":"A bilingual digital academy for medical learning, student development, research projects, and verifiable certificates.",
    "hero.explore":"Explore Courses",
    "hero.verify":"Verify Certificate",
    "hero.bilingual":"Arabic & English",
    "hero.qr":"QR Verification",
    "hero.portal":"Student Portal",

    "metrics.courses":"Medical Courses",
    "metrics.research":"Research Projects",
    "metrics.verify":"Certificate Verification",

    "courses.eyebrow":"Learning",
    "courses.title":"Medical Courses",
    "courses.text":"Structured theoretical medical learning with completion certificates.",

    "research.eyebrow":"NABD Research Center",
    "research.title":"Research & Scientific Projects",
    "research.text":"Transparent project pages that distinguish protocols, ongoing studies, and completed work.",

    "verify.eyebrow":"Verify Certificate",
    "verify.title":"Check the Authenticity of Your Certificate",
    "verify.text":"Enter the certificate ID exactly as shown on the Certificate of Completion.",
    "verify.button":"Verify Certificate",
    "verify.empty":"Verification result will appear here.",

    "achievements.eyebrow":"Milestones",
    "achievements.title":"Research & Achievements",
    "achievements.text":"Documented milestones, research activity, and transparent recognition.",
    "achievements.pendingTitle":"Evidence-first Recognition",
    "achievements.pendingText":"Awards and recognitions are published only after documentary verification.",

    "about.eyebrow":"About NABD",
    "about.title":"Accessible medical learning with verifiable outcomes",
    "about.text":"NABD Academy for Medical Sciences is an educational initiative focused on theoretical medical courses, research development, and transparent certificates of completion.",
    "about.transparency":"Academic Transparency",
    "about.disclaimer":"Certificates are certificates of completion and do not represent a university degree or governmental accreditation unless explicitly stated and documented.",

    "cta.form":"Start Learning",
    "cta.whatsapp":"WhatsApp",

    "footer.tagline":"Learn • Research • Verify • Grow",
    "footer.contact":"Official contact channels"
  },

  ar:{
    "nav.home":"الرئيسية",
    "nav.courses":"الدورات",
    "nav.research":"الأبحاث",
    "nav.verify":"التحقق",
    "nav.achievements":"الإنجازات",
    "nav.about":"من نحن",
    "nav.login":"دخول الطالب",

    "hero.eyebrow":"تعليم طبي • بحث علمي • تحقق من الشهادات",
    "hero.title":"تعلّم • ابحث • تحقّق • تطوّر",
    "hero.text":"أكاديمية رقمية ثنائية اللغة للتعليم الطبي، تطوير الطلاب، المشاريع البحثية، والشهادات القابلة للتحقق.",
    "hero.explore":"استكشف الدورات",
    "hero.verify":"تحقق من شهادة",
    "hero.bilingual":"العربية والإنجليزية",
    "hero.qr":"تحقق عبر QR",
    "hero.portal":"بوابة الطالب",

    "metrics.courses":"الدورات الطبية",
    "metrics.research":"المشاريع البحثية",
    "metrics.verify":"التحقق من الشهادات",

    "courses.eyebrow":"التعليم",
    "courses.title":"الدورات الطبية",
    "courses.text":"تعليم طبي نظري منظم مع شهادات إتمام.",

    "research.eyebrow":"مركز نبض للأبحاث",
    "research.title":"الأبحاث والمشاريع العلمية",
    "research.text":"صفحات شفافة توضح ما إذا كان المشروع بروتوكولًا أو دراسة جارية أو عملًا مكتملًا.",

    "verify.eyebrow":"التحقق من الشهادة",
    "verify.title":"تحقق من أصالة شهادتك",
    "verify.text":"أدخل رقم الشهادة كما يظهر تمامًا على شهادة الإتمام.",
    "verify.button":"تحقق من الشهادة",
    "verify.empty":"ستظهر نتيجة التحقق هنا.",

    "achievements.eyebrow":"محطات وإنجازات",
    "achievements.title":"الأبحاث والإنجازات",
    "achievements.text":"محطات موثقة ونشاط بحثي وتكريمات منشورة بشفافية.",
    "achievements.pendingTitle":"التكريم القائم على الدليل",
    "achievements.pendingText":"لا يتم نشر الجوائز والتكريمات إلا بعد التحقق من مستنداتها.",

    "about.eyebrow":"عن نبض",
    "about.title":"تعليم طبي متاح بنتائج قابلة للتحقق",
    "about.text":"أكاديمية نبض للعلوم الطبية مبادرة تعليمية تركز على الدورات الطبية النظرية، تطوير البحث العلمي، وشهادات الإتمام الشفافة.",
    "about.transparency":"الشفافية الأكاديمية",
    "about.disclaimer":"الشهادات هي شهادات إتمام ولا تمثل درجة جامعية أو اعتمادًا حكوميًا إلا إذا ذُكر ذلك صراحة مع توثيق رسمي.",

    "cta.form":"ابدأ التعلم",
    "cta.whatsapp":"واتساب",

    "footer.tagline":"تعلّم • ابحث • تحقّق • تطوّر",
    "footer.contact":"قنوات التواصل الرسمية"
  }
};


let lang=
  localStorage.getItem('nabd_lang')||
  'en';


const $=
  selector=>
    document.querySelector(selector);


/* =========================================================
   BASIC HELPERS
   ========================================================= */

async function loadJSON(path){

  const response=
    await fetch(path);

  if(!response.ok){

    throw new Error(
      'Failed to load '+path
    );

  }

  return response.json();

}


function esc(value=''){

  return String(value)
    .replace(
      /[&<>'"]/g,
      char=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        "'":'&#39;',
        '"':'&quot;'
      }[char])
    );

}


let courses=[];
let research=[];
let sampleCertificates=[];


/* =========================================================
   COURSE IMAGES
   ========================================================= */

const COURSE_IMAGES={

  'medical-terminology':
    'assets/images/medical-terminology.jpg',

  'general-anatomy':
    'assets/images/anatomy.jpg',

  'anatomy':
    'assets/images/anatomy.jpg',

  'physiology':
    'assets/images/physiology.jpg',

  'biochemistry':
    'assets/images/biochemistry.jpg',

  'pathology':
    'assets/images/pathology.jpg'

};


function normalizeCourseKey(course){

  return String(
    course?.slug||
    course?.id||
    course?.title_en||
    course?.title||
    ''
  )
  .trim()
  .toLowerCase()
  .replace(/&/g,'and')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'');

}


function courseImage(course){

  const key=
    normalizeCourseKey(course);


  if(COURSE_IMAGES[key]){

    return COURSE_IMAGES[key];

  }


  const title=
    String(
      course?.title_en||
      course?.title||
      ''
    )
    .toLowerCase();


  if(title.includes('terminology')){

    return COURSE_IMAGES[
      'medical-terminology'
    ];

  }


  if(title.includes('anatom')){

    return COURSE_IMAGES[
      'anatomy'
    ];

  }


  if(title.includes('physio')){

    return COURSE_IMAGES[
      'physiology'
    ];

  }


  if(title.includes('biochem')){

    return COURSE_IMAGES[
      'biochemistry'
    ];

  }


  if(title.includes('patholog')){

    return COURSE_IMAGES[
      'pathology'
    ];

  }


  return 'assets/images/hero-medical.jpg';

}


/* =========================================================
   LOAD PUBLIC DATA
   ========================================================= */

async function loadPublicData(){

  if(window.nabdSupabase){


    const [
      {
        data:c,
        error:ce
      },
      {
        data:r,
        error:re
      }
    ]=
    await Promise.all([


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


    if(
      !ce &&
      Array.isArray(c)
    ){

      courses=
        c.map(
          x=>({

            ...x,

            id:x.slug,

            level:x.level_en,

            status:x.status

          })
        );

    }


    if(
      !re &&
      Array.isArray(r)
    ){

      research=
        r.map(
          x=>({

            ...x,

            id:x.slug,

            slug:x.slug,

            project_no:x.project_no,

            title:x.title_en,

            subtitle:x.subtitle_en,

            field:x.field,

            status:x.status,

            summary:x.summary_en,

            title_ar:x.title_ar,

            summary_ar:x.summary_ar

          })
        );

    }

  }


  if(!courses.length){

    courses=
      await loadJSON(
        'data/courses.json'
      );

  }


  if(!research.length){

    research=
      await loadJSON(
        'data/research.json'
      );

  }


  try{

    sampleCertificates=
      await loadJSON(
        'data/certificates.sample.json'
      );

  }catch(_){

    sampleCertificates=[];

  }

}


/* =========================================================
   LANGUAGE
   ========================================================= */

function applyLang(){

  document.documentElement.lang=
    lang;

  document.documentElement.dir=
    lang==='ar'
      ?'rtl'
      :'ltr';


  document
    .querySelectorAll(
      '[data-i18n]'
    )
    .forEach(
      element=>{

        const key=
          element.dataset.i18n;

        if(
          i18n[lang]?.[key]
        ){

          element.textContent=
            i18n[lang][key];

        }

      }
    );


  const langButton=
    $('#langBtn');


  if(langButton){

    langButton.textContent=
      lang==='en'
        ?'العربية'
        :'English';

  }


  renderDynamic();

  renderContact();

}


/* =========================================================
   COURSES + RESEARCH
   ========================================================= */

function renderDynamic(){

  const courseGrid=
    $('#courseGrid');


  if(courseGrid){

    courseGrid.innerHTML=
      courses
      .map(
        (
          course,
          index
        )=>{


          const title=
            lang==='ar'
              ?(
                course.title_ar||
                course.title_en||
                course.title
              )
              :(
                course.title_en||
                course.title||
                ''
              );


          const description=
            lang==='ar'
              ?(
                course.description_ar||
                course.description_en||
                ''
              )
              :(
                course.description_en||
                course.description||
                ''
              );


          const level=
            lang==='ar'
              ?(
                course.level_ar||
                course.level||
                ''
              )
              :(
                course.level_en||
                course.level||
                ''
              );


          const slug=
            course.slug||
            course.id||
            '';


          const image=
            courseImage(course);


          return `

            <article
              class="course-card"
            >


              <div
                class="course-media"
              >

                <img
                  src="${esc(image)}"
                  alt="${esc(title)}"
                  loading="lazy"
                  decoding="async"
                >


                <span
                  class="course-index"
                >
                  ${
                    String(
                      index+1
                    )
                    .padStart(
                      2,
                      '0'
                    )
                  }
                </span>

              </div>



              <span class="badge">

                ${
                  esc(
                    course.status||
                    'active'
                  )
                }

              </span>



              <h3>

                ${esc(title)}

              </h3>



              <p>

                ${esc(description)}

              </p>



              <div class="meta">

                <span>

                  ${
                    esc(
                      course.hours||
                      ''
                    )
                  }

                  ${
                    lang==='ar'
                      ?'ساعة'
                      :'hrs'
                  }

                </span>


                <span>

                  ${esc(level)}

                </span>

              </div>



              <div
                class="card-actions"
              >


                <a
                  class="text-link"
                  href="course.html?id=${encodeURIComponent(slug)}"
                >

                  ${
                    lang==='ar'
                      ?'التفاصيل'
                      :'Details'
                  }

                  →

                </a>


                <a
                  class="text-link"
                  href="enroll.html?course=${encodeURIComponent(slug)}"
                >

                  ${
                    lang==='ar'
                      ?'التسجيل'
                      :'Enroll'
                  }

                  →

                </a>


              </div>


            </article>

          `;

        }
      )
      .join('');

  }



  const researchGrid=
    $('#researchGrid');


  if(researchGrid){

    researchGrid.innerHTML=
      research
      .map(
        item=>{


          const title=
            lang==='ar'
              ?(
                item.title_ar||
                item.title
              )
              :(
                item.title||
                ''
              );


          const summary=
            lang==='ar'
              ?(
                item.summary_ar||
                item.summary
              )
              :(
                item.summary||
                ''
              );


          const slug=
            item.slug||
            item.id||
            '';


          return `

            <article
              class="research-card"
            >


              <div
                class="project-no"
              >

                ${
                  esc(
                    item.project_no||
                    ''
                  )
                }

              </div>



              <div>


                <span class="badge">

                  ${
                    esc(
                      item.status||
                      ''
                    )
                  }

                </span>



                <h3>

                  ${esc(title)}

                </h3>



                ${
                  item.subtitle
                  ?`
                    <h4>
                      ${esc(item.subtitle)}
                    </h4>
                  `
                  :''
                }



                <p>

                  ${esc(summary)}

                </p>



                <div class="meta">

                  <span>

                    ${
                      esc(
                        item.field||
                        ''
                      )
                    }

                  </span>

                </div>



                <a
                  class="text-link"
                  href="research.html?id=${encodeURIComponent(slug)}"
                >

                  ${
                    lang==='ar'
                      ?'عرض المشروع'
                      :'View project'
                  }

                  →

                </a>


              </div>


            </article>

          `;

        }
      )
      .join('');

  }



  const courseCount=
    $('#courseCount');


  if(courseCount){

    courseCount.textContent=
      courses.length;

  }



  const researchCount=
    $('#researchCount');


  if(researchCount){

    researchCount.textContent=
      research.length;

  }

}


/* =========================================================
   CONTACT
   ========================================================= */

function renderContact(){

  const config=
    window.NABD_CONFIG||
    {};


  const whatsapp=
    config.contact?.whatsapp;


  const whatsappButton=
    $('#whatsappCta');


  if(
    whatsappButton &&
    whatsapp &&
    whatsapp!=='TO_CONFIRM'
  ){

    whatsappButton.classList.remove(
      'disabled'
    );

    whatsappButton.removeAttribute(
      'aria-disabled'
    );

    whatsappButton.href=
      `https://wa.me/${
        whatsapp.replace(
          /\D/g,
          ''
        )
      }`;

  }



  const contactBox=
    $('#contactBlock');


  if(!contactBox){

    return;

  }


  const lines=[];


  if(
    config.contact?.email &&
    config.contact.email!=='TO_CONFIRM'
  ){

    lines.push(

      `<a href="mailto:${esc(config.contact.email)}">
        ${esc(config.contact.email)}
      </a>`

    );

  }


  if(
    whatsapp &&
    whatsapp!=='TO_CONFIRM'
  ){

    lines.push(

      `<a href="https://wa.me/${whatsapp.replace(/\D/g,'')}">
        WhatsApp: ${esc(whatsapp)}
      </a>`

    );

  }


  if(
    config.contact?.telegram &&
    config.contact.telegram!=='TO_CONFIRM'
  ){

    lines.push(

      `<span>
        Telegram:
        ${esc(config.contact.telegram)}
      </span>`

    );

  }


  contactBox.innerHTML=

    `
      <strong>
        ${
          lang==='ar'
            ?'التواصل'
            :'Contact'
        }
      </strong>

      ${
        lines.length
          ?lines.join('')
          :i18n[lang]['footer.contact']
      }
    `;

}


/* =========================================================
   PDF LIBRARY
   ========================================================= */

async function ensureJsPDF(){

  if(
    window.jspdf?.jsPDF
  ){

    return window.jspdf.jsPDF;

  }


  await new Promise(
    (
      resolve,
      reject
    )=>{


      const script=
        document.createElement(
          'script'
        );


      script.src=
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';


      script.onload=
        resolve;


      script.onerror=
        reject;


      document.head.appendChild(
        script
      );

    }
  );


  if(
    !window.jspdf?.jsPDF
  ){

    throw new Error(
      'jsPDF library failed to load'
    );

  }


  return window.jspdf.jsPDF;

}


async function imageToDataURL(url){

  const response=
    await fetch(url);


  if(!response.ok){

    throw new Error(
      'Certificate image not found'
    );

  }


  const blob=
    await response.blob();


  return new Promise(
    (
      resolve,
      reject
    )=>{


      const reader=
        new FileReader();


      reader.onload=
        ()=>resolve(
          reader.result
        );


      reader.onerror=
        reject;


      reader.readAsDataURL(
        blob
      );

    }
  );

}


/* =========================================================
   CERTIFICATE VERIFICATION
   ========================================================= */

async function verify(id){

  const box=
    $('#verifyResult');


  if(
    !box||
    !id
  ){

    return;

  }


  box.className=
    'verify-result empty';


  box.textContent=
    lang==='ar'
      ?'جاري التحقق…'
      :'Checking…';


  let hit=null;


  if(
    window.nabdSupabase
  ){


    try{


      const {
        data,
        error
      }=
      await window.nabdSupabase.rpc(

        'verify_certificate',

        {
          input_certificate_id:id
        }

      );


      if(error){

        console.error(
          'Certificate verification error:',
          error
        );

      }


      if(
        !error &&
        Array.isArray(data) &&
        data.length
      ){

        hit=data[0];

      }


    }catch(error){


      console.error(
        'Certificate verification error:',
        error
      );


    }


  }else{


    hit=
      sampleCertificates
      .find(
        item=>

          String(
            item.certificate_id||
            ''
          )
          .toLowerCase()

          ===

          id.toLowerCase()

      );


  }


  if(!hit){


    box.className=
      'verify-result invalid';


    box.innerHTML=`

      <strong>

        ${
          lang==='ar'
            ?'لم يتم العثور على الشهادة'
            :'Certificate not found'
        }

      </strong>


      <p>

        ${
          lang==='ar'
            ?'تحقق من الرقم أو تواصل مع الأكاديمية.'
            :'Check the certificate ID or contact the academy.'
        }

      </p>

    `;


    return;

  }



  const valid=

    String(
      hit.status||
      ''
    )
    .toLowerCase()

    ===

    'valid';



  const verificationUrl=

    `${location.origin}${location.pathname}?certificate=${encodeURIComponent(hit.certificate_id)}#verify`;



  const certificateImageUrl=

    `assets/certificates/${encodeURIComponent(hit.certificate_id)}.jpg`;



  box.className=

    `verify-result ${
      valid
        ?'valid'
        :'invalid'
    }`;



  box.innerHTML=`

    <span class="status-pill">

      ${
        valid

          ?(
            lang==='ar'
              ?'صالحة ✓'
              :'VALID ✓'
          )

          :(
            lang==='ar'
              ?'ملغاة'
              :'REVOKED'
          )
      }

    </span>



    <h3>

      ${
        esc(
          hit.public_name||
          hit.student_name||
          ''
        )
      }

    </h3>



    <p>

      <strong>

        ${
          esc(
            hit.course_title||
            hit.course||
            ''
          )
        }

      </strong>

    </p>



    <dl>


      <div>

        <dt>
          ID
        </dt>

        <dd>
          ${esc(hit.certificate_id)}
        </dd>

      </div>



      <div>

        <dt>

          ${
            lang==='ar'
              ?'الساعات'
              :'Hours'
          }

        </dt>

        <dd>
          ${esc(hit.hours||'')}
        </dd>

      </div>



      <div>

        <dt>

          ${
            lang==='ar'
              ?'تاريخ الإصدار'
              :'Issue date'
          }

        </dt>

        <dd>
          ${esc(hit.issue_date||'')}
        </dd>

      </div>


    </dl>



    <div
      class="certificate-preview-wrap"
    >

      <img
        id="certificateImage"
        src="${certificateImageUrl}"
        alt="NABD Certificate ${esc(hit.certificate_id)}"
        loading="lazy"
        decoding="async"
      >

    </div>



    <div
      class="certificate-actions"
    >


      <a
        id="viewCertificate"
        href="${certificateImageUrl}"
        target="_blank"
        rel="noopener"
      >

        ${
          lang==='ar'
            ?'عرض الشهادة'
            :'View Certificate'
        }

      </a>



      <button
        id="downloadCertificatePdf"
        type="button"
      >

        ${
          lang==='ar'
            ?'تنزيل الشهادة PDF'
            :'Download Certificate PDF'
        }

      </button>


    </div>



    <div
      id="verifyQr"
      class="qr-box"
    ></div>



    <button
      class="text-btn"
      id="copyVerifyLink"
      type="button"
    >

      ${
        lang==='ar'
          ?'نسخ رابط التحقق'
          :'Copy verification link'
      }

    </button>

  `;



  const certificateImage=
    $('#certificateImage');


  const pdfButton=
    $('#downloadCertificatePdf');


  const viewButton=
    $('#viewCertificate');


  if(certificateImage){


    certificateImage.onerror=
      ()=>{


        certificateImage.style.display=
          'none';


        if(pdfButton){

          pdfButton.style.display=
            'none';

        }


        if(viewButton){

          viewButton.style.display=
            'none';

        }


      };


  }



  if(window.QRCode){


    const qrElement=
      $('#verifyQr');


    if(qrElement){


      new QRCode(

        qrElement,

        {

          text:verificationUrl,

          width:128,

          height:128

        }

      );


    }


  }



  const copyButton=
    $('#copyVerifyLink');


  if(copyButton){


    copyButton.onclick=
      async()=>{


        try{


          await navigator
            .clipboard
            .writeText(
              verificationUrl
            );


          copyButton.textContent=

            lang==='ar'
              ?'تم النسخ ✓'
              :'Copied ✓';


        }catch(error){


          console.error(
            'Clipboard error:',
            error
          );


        }


      };


  }



  if(pdfButton){


    pdfButton.onclick=
      async()=>{


        const originalText=
          pdfButton.textContent;


        try{


          pdfButton.disabled=true;


          pdfButton.textContent=

            lang==='ar'
              ?'جاري إنشاء PDF…'
              :'Creating PDF…';



          const dataUrl=

            await imageToDataURL(
              certificateImageUrl
            );



          const image=
            new Image();


          image.src=
            dataUrl;



          await new Promise(

            (
              resolve,
              reject
            )=>{


              image.onload=
                resolve;


              image.onerror=
                reject;


            }

          );



          const jsPDF=
            await ensureJsPDF();



          const orientation=

            image.width>=image.height
              ?'landscape'
              :'portrait';



          const pdf=

            new jsPDF({

              orientation,

              unit:'mm',

              format:'a4'

            });



          const pageWidth=

            pdf
            .internal
            .pageSize
            .getWidth();



          const pageHeight=

            pdf
            .internal
            .pageSize
            .getHeight();



          const margin=5;


          const availableWidth=

            pageWidth-
            (
              margin*2
            );


          const availableHeight=

            pageHeight-
            (
              margin*2
            );


          const ratio=

            Math.min(

              availableWidth/
              image.width,

              availableHeight/
              image.height

            );


          const width=

            image.width*
            ratio;


          const height=

            image.height*
            ratio;


          const x=

            (
              pageWidth-
              width
            )/2;


          const y=

            (
              pageHeight-
              height
            )/2;



          pdf.addImage(

            dataUrl,

            'JPEG',

            x,

            y,

            width,

            height,

            undefined,

            'FAST'

          );



          pdf.save(

            `${hit.certificate_id}.pdf`

          );


        }catch(error){


          console.error(
            'PDF generation error:',
            error
          );


          alert(

            lang==='ar'
              ?'تعذر إنشاء ملف PDF. حاول مرة أخرى.'
              :'Could not create the PDF. Please try again.'

          );


        }finally{


          pdfButton.disabled=false;


          pdfButton.textContent=
            originalText;


        }


      };


  }

}


/* =========================================================
   COMPLAINTS & FEEDBACK
   ========================================================= */

async function submitFeedback(){

  const form=
    $('#feedbackForm');


  const status=
    $('#feedbackStatus');


  if(
    !form||
    !status
  ){

    return;

  }



  const name=

    $('#feedbackName')
      ?.value
      .trim()||
    '';



  const email=

    $('#feedbackEmail')
      ?.value
      .trim()||
    '';



  const category=

    $('#feedbackCategory')
      ?.value||
    'other';



  const message=

    $('#feedbackMessage')
      ?.value
      .trim()||
    '';



  if(!message){


    status.textContent=

      lang==='ar'
        ?'اكتب رسالتك أولًا.'
        :'Please write your message first.';


    return;

  }



  status.textContent=

    lang==='ar'
      ?'جاري الإرسال…'
      :'Sending…';



  if(!window.nabdSupabase){


    status.textContent=

      lang==='ar'
        ?'نظام الملاحظات غير متصل حاليًا.'
        :'Feedback system is not connected yet.';


    return;

  }



  try{


    const {
      error
    }=

    await window.nabdSupabase
      .from('feedback')
      .insert([

        {

          name:
            name||
            null,

          email:
            email||
            null,

          category,

          message,

          status:'new'

        }

      ]);



    if(error){

      throw error;

    }



    form.reset();



    status.textContent=

      lang==='ar'
        ?'تم إرسال رسالتك بنجاح ✓'
        :'Your message was sent successfully ✓';



  }catch(error){


    console.error(
      'Feedback submission error:',
      error
    );


    status.textContent=

      lang==='ar'
        ?'نظام الشكاوى قيد التجهيز. سنربطه بقاعدة البيانات في الخطوة التالية.'
        :'The feedback system is being prepared. Database connection is the next step.';


  }

}


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  async()=>{


    try{


      await loadPublicData();


    }catch(error){


      console.error(
        'Public data error:',
        error
      );


    }



    applyLang();



    const year=
      $('#year');


    if(year){

      year.textContent=
        new Date()
        .getFullYear();

    }



    const langButton=
      $('#langBtn');


    if(langButton){


      langButton.onclick=
        ()=>{


          lang=

            lang==='en'
              ?'ar'
              :'en';



          localStorage.setItem(

            'nabd_lang',

            lang

          );



          applyLang();


        };


    }



    const menuButton=
      $('#menuBtn');


    const mainNav=
      $('#mainNav');


    if(
      menuButton &&
      mainNav
    ){


      menuButton.onclick=
        ()=>{


          mainNav
            .classList
            .toggle(
              'open'
            );


        };



      mainNav
        .querySelectorAll(
          'a'
        )
        .forEach(
          link=>{


            link.addEventListener(
              'click',
              ()=>{


                mainNav
                  .classList
                  .remove(
                    'open'
                  );


              }
            );


          }
        );


    }



    const verifyForm=
      $('#verifyForm');


    if(verifyForm){


      verifyForm.onsubmit=
        event=>{


          event.preventDefault();


          const input=
            $('#certificateId');


          if(input){


            verify(
              input.value.trim()
            );


          }


        };


    }



    const feedbackForm=
      $('#feedbackForm');


    if(feedbackForm){


      feedbackForm.onsubmit=
        event=>{


          event.preventDefault();


          submitFeedback();


        };


    }



    const preset=

      new URLSearchParams(
        location.search
      )
      .get(
        'certificate'
      );



    const certificateInput=
      $('#certificateId');


    if(
      preset &&
      certificateInput
    ){


      certificateInput.value=
        preset;


      setTimeout(

        ()=>verify(
          preset
        ),

        50

      );


    }


  }
);
