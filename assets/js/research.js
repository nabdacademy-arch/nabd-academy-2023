const client = window.nabdSupabase;
const box = document.getElementById('researchDetail');

function esc(v = '') {
  return String(v).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}

async function loadResearch() {
  const slug = new URLSearchParams(location.search).get('id');
  const lang = localStorage.getItem('nabd_lang') || 'en';

  if (!slug) {
    box.innerHTML = `
      <h1>Research project not found</h1>
      <a class="btn" href="index.html#research">Back to Research</a>
    `;
    return;
  }

  if (!client) {
    box.innerHTML = `
      <h1>Backend unavailable</h1>
      <p>The research database is not connected.</p>
    `;
    return;
  }

  box.innerHTML = `<p>Loading research project…</p>`;

  const { data, error } = await client
    .from('research_projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    box.innerHTML = `
      <h1>Research project not found</h1>
      <p>${esc(error?.message || 'This project does not exist.')}</p>
      <a class="btn" href="index.html#research">Back to Research</a>
    `;
    return;
  }

  const title =
    lang === 'ar'
      ? (data.title_ar || data.title_en)
      : data.title_en;

  const subtitle =
    lang === 'ar'
      ? (data.subtitle_ar || data.subtitle_en)
      : data.subtitle_en;

  const summary =
    lang === 'ar'
      ? (data.summary_ar || data.summary_en)
      : data.summary_en;

  const abstract =
    lang === 'ar'
      ? (data.abstract_ar || data.abstract_en)
      : data.abstract_en;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.title = `${title} | NABD Research Center`;

  box.innerHTML = `
    <span class="eyebrow">
      ${
        lang === 'ar'
          ? 'مركز نبض للأبحاث'
          : 'NABD Research Center'
      }
    </span>

    <div class="meta">
      <span>Project ${esc(data.project_no || '')}</span>
      <span class="badge">${esc(data.status || '')}</span>
    </div>

    <h1>${esc(title)}</h1>

    ${
      subtitle
        ? `<h2>${esc(subtitle)}</h2>`
        : ''
    }

    <p class="lead">${esc(summary || '')}</p>

    <div class="meta">
      <span>${esc(data.field || '')}</span>
      <span>${esc(data.author_display || '')}</span>
    </div>

    ${
      abstract
        ? `
          <h2>
            ${lang === 'ar' ? 'الملخص' : 'Abstract'}
          </h2>
          <p>${esc(abstract)}</p>
        `
        : ''
    }

    ${
      data.evidence_url
        ? `
          <div class="notice-card">
            <strong>
              ${
                lang === 'ar'
                  ? 'دليل أو مصدر مرتبط'
                  : 'Related evidence or source'
              }
            </strong>

            <p>
              <a
                class="text-link"
                href="${esc(data.evidence_url)}"
                target="_blank"
                rel="noopener"
              >
                ${
                  lang === 'ar'
                    ? 'فتح المصدر'
                    : 'Open source'
                }
              </a>
            </p>
          </div>
        `
        : ''
    }

    <div class="hero-actions">
      <a
        class="btn btn-ghost"
        href="index.html#research"
      >
        ${
          lang === 'ar'
            ? 'العودة إلى الأبحاث'
            : 'Back to Research'
        }
      </a>
    </div>
  `;
}

loadResearch();
