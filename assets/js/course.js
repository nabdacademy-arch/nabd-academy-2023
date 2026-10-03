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
  const lang = localStorage.getItem('nabd_lang') || 'en';

  if (!slug) {
    box.innerHTML = `
      <h1>Course not found</h1>
      <p>No course ID was provided.</p>
      <a class="btn" href="index.html#courses">Back to Courses</a>
    `;
    return;
  }

  if (!client) {
    box.innerHTML = `
      <h1>Backend unavailable</h1>
      <p>The course database is not connected.</p>
    `;
    return;
  }

  box.innerHTML = `<p>Loading course…</p>`;

  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    box.innerHTML = `
      <h1>Course not found</h1>
      <p>${esc(error?.message || 'This course does not exist.')}</p>
      <a class="btn" href="index.html#courses">Back to Courses</a>
    `;
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

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

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
