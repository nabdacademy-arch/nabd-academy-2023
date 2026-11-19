const client = window.nabdSupabase;
const box = document.getElementById('courseDetail');

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

async function loadCourse() {
  const slug = new URLSearchParams(location.search).get('id');
  let lang = 'en';
  try {
    if (localStorage.getItem('nabd_lang') === 'ar') lang = 'ar';
  } catch {
    // The page still works when the browser blocks preference storage.
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const text = (ar, en) => lang === 'ar' ? ar : en;
  const back = `<a class="btn btn-ghost" href="index.html#courses">${text('العودة للدورات', 'Back to Courses')}</a>`;

  if (!slug) {
    box.innerHTML = `<h1>${text('رابط الدورة غير مكتمل', 'Incomplete course link')}</h1>
      <p>${text('اختر دورة من القائمة.', 'Choose a course from the list.')}</p>${back}`;
    return;
  }

  let data;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  box.innerHTML = `<p role="status">${text('جارٍ تحميل الدورة…', 'Loading course…')}</p>`;
  try {
    if (!client) throw new Error('Course service unavailable');
    const result = await client.from('courses').select('*')
      .eq('slug', slug).abortSignal(controller.signal).maybeSingle();
    if (result.error || controller.signal.aborted) throw new Error('Course lookup failed');
    data = result.data;
  } catch {
    box.innerHTML = `<h1>${text('تعذّر تحميل تفاصيل الدورة', 'Could not load course details')}</h1>
      <p>${text('تحقق من اتصالك ثم حاول مجددًا.', 'Check your connection and try again.')}</p>
      <button class="btn" type="button">${text('إعادة المحاولة', 'Try again')}</button> ${back}`;
    box.querySelector('button').addEventListener('click', client ? loadCourse : () => location.reload(), {once:true});
    return;
  } finally {
    clearTimeout(timeout);
  }

  if (!data) {
    box.innerHTML = `<h1>${text('الدورة غير متاحة', 'Course unavailable')}</h1>
      <p>${text('لم نجد دورة متاحة بهذا الرابط.', 'No available course matches this link.')}</p>${back}`;
    return;
  }

  const title =
    lang === 'ar'
      ? (data.title_ar || data.title_en)
      : data.title_en;

  const description =
    lang === 'ar'
      ? (data.description_ar || data.description_en)
      : data.description_en;

  const level =
    lang === 'ar'
      ? (data.level_ar || data.level_en)
      : data.level_en;

  const modules = Array.isArray(data.modules)
    ? data.modules
    : [];

  document.title = `${title} | NABD Academy`;

  box.innerHTML = `
    <span class="eyebrow">
      ${lang === 'ar' ? 'دورات نبض' : 'NABD Courses'}
    </span>

    <h1>${esc(title)}</h1>

    <p class="lead">
      ${esc(description || '')}
    </p>

    <div class="meta">
      <span>
        ${lang === 'ar' ? 'الساعات' : 'Hours'}:
        <strong>${esc(data.hours)}</strong>
      </span>

      <span>
        ${lang === 'ar' ? 'المستوى' : 'Level'}:
        <strong>${esc(level || '')}</strong>
      </span>

      <span class="badge">
        ${esc(data.status)}
      </span>
    </div>

    <h2>
      ${lang === 'ar' ? 'محتوى الدورة' : 'Course Modules'}
    </h2>

    ${
      modules.length
        ? `
          <ol class="module-list">
            ${modules.map(m => `<li>${esc(m)}</li>`).join('')}
          </ol>
        `
        : `
          <p>
            ${
              lang === 'ar'
                ? 'سيتم إضافة محتوى الدورة قريبًا.'
                : 'Course modules will be added soon.'
            }
          </p>
        `
    }

    <div class="hero-actions">
      <a
        class="btn"
        href="enroll.html?course=${encodeURIComponent(data.slug)}"
      >
        ${lang === 'ar' ? 'التسجيل في الدورة' : 'Enroll Now'}
      </a>

      <a
        class="btn btn-ghost"
        href="index.html#courses"
      >
        ${lang === 'ar' ? 'العودة للدورات' : 'Back to Courses'}
      </a>
    </div>
  `;
}

loadCourse();
