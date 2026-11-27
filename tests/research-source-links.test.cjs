const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'research.html'), 'utf8');
const scriptPath = html.match(/src="([^"]*\/research\.js)"/)[1];
const script = fs.readFileSync(path.join(root, scriptPath), 'utf8');

async function render(evidence_url, lang) {
  const article = {};
  const query = {
    select() { return this; },
    eq() { return this; },
    async maybeSingle() { return {data: {title_en:'Project', title_ar:'مشروع', evidence_url}}; }
  };
  const document = {baseURI:'https://example.org/academy/research.html', documentElement:{},
    getElementById(id) { assert.equal(id, 'researchDetail'); return article; }};
  await vm.runInNewContext(script, {document, URL, URLSearchParams, location:{search:'?id=sample'},
    localStorage:{getItem:()=>lang}, window:{nabdSupabase:{from:()=>query}}});
  return article.innerHTML;
}

test('research detail opens web and relative references in the selected language', async () => {
  for (const [url, lang, href, label] of [
    ['https://example.net/p?a=1&b=2','ar','https://example.net/p?a=1&amp;b=2','فتح المصدر'],
    ['papers/report.pdf','en','https://example.org/academy/papers/report.pdf','Open source'],
    ['http://example.net/archive','en','http://example.net/archive','Open source']
  ]) {
    const content = await render(url, lang);
    assert.ok(content.includes('href="' + href + '"'));
    assert.ok(content.includes(label));
    assert.ok(content.includes('rel="noopener noreferrer"'));
  }
});

test('unusable reference omits the link and preserves the research project', async () => {
  for (const url of [null, ' ', 'https://', 'file:///sample.pdf', 'about:blank', 'javascript:', 'https://user@example.net/']) {
    const content = await render(url, 'ar');
    assert.ok(content.includes('<h1>مشروع</h1>'));
    assert.ok(content.includes('href="index.html#research"'));
    assert.ok(!content.includes('class="notice-card"'));
  }
});
