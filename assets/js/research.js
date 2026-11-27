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

function researchSourceHref(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, document.baseURI);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
    return url.href;
  } catch {
    return '';
  }
}

async function loadResearch() {
  const slug = new URLSearchParams(location.search).get('id');
  let lang = 'en';
  try {
    if (localStorage.getItem('nabd_lang') === 'ar') lang = 'ar';
  } catch {
    // The project remains readable when browser storage is blocked.
  }
  const ar = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
  const back = '<a class="btn" href="index.html#research">' +
    (ar ? 'العودة إلى الأبحاث' : 'Back to Research') + '</a>';

  function showMissing() {
    box.innerHTML = '<h1>' + (ar ? 'لم يُعثر على المشروع البحثي' : 'Research project not found') + '</h1>' + back;
  }
  function showUnavailable() {
    const retry = '?' + new URLSearchParams({id: slug}).toString();
    box.innerHTML = '<h1>' + (ar ? 'تعذّر تحميل المشروع البحثي' : 'Could not load the research project') +
      '</h1><p>' + (ar ? 'تحقق من الاتصال ثم أعد المحاولة.' : 'Check your connection and try again.') +
      '</p><a class="btn" href="' + esc(retry) + '">' + (ar ? 'إعادة المحاولة' : 'Try again') + '</a> ' + back;
  }

  if (!slug) return showMissing();
  if (!client) return showUnavailable();
  box.innerHTML = '<p role="status">' + (ar ? 'جارٍ تحميل المشروع البحثي…' : 'Loading research project…') + '</p>';
  let response;
  try {
    response = await client.from('research_projects').select('*').eq('slug', slug).maybeSingle();
  } catch {
    return showUnavailable();
  }
  if (!response || response.error) return showUnavailable();
  if (!response.data) return showMissing();
  const data = response.data;

  function translation(arabic, english) {
    const preferred = ar ? arabic : english;
    const fallback = ar ? english : arabic;
    return preferred?.trim() || fallback?.trim() || '';
  }

  const title = translation(data.title_ar, data.title_en) || (ar ? 'مشروع بحثي' : 'Research project');
  const subtitle = translation(data.subtitle_ar, data.subtitle_en);
  const summary = translation(data.summary_ar, data.summary_en);
  const abstract = translation(data.abstract_ar, data.abstract_en);

  const sourceHref = researchSourceHref(data.evidence_url);
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
      sourceHref
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
                href="${esc(sourceHref)}"
                target="_blank"
                rel="noopener noreferrer"
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
