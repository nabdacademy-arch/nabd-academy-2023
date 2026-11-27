const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname,'../assets/js/research.js'),'utf8');

async function open(search, fetchRecord, language = ()=>'ar') {
  const box = {};
  const root = {};
  const client = fetchRecord && {from(){return this;},select(){return this;},eq(key,value){this.slug=value;return this;},maybeSingle(){return fetchRecord(this.slug);}};
  await vm.runInNewContext(script,{URL, URLSearchParams,document:{getElementById:()=>box,documentElement:root,baseURI:'https://example.org/research.html'},
    window:{nabdSupabase:client},location:{search},localStorage:{getItem:language}});
  return {html:box.innerHTML,dir:root.dir};
}

test('failed reads retain a retry link for the exact project',async()=>{
  const search='?id=a%26b';
  for(const backend of [null,()=>{throw Error('private detail');},()=>({error:{message:'private detail'}})]){
    const {html,dir}=await open(search,backend);
    assert.equal(dir,'rtl');
    assert.match(html,/إعادة المحاولة/);
    assert.doesNotMatch(html,/private detail|لم يُعثر/);
    const retry=html.match(/href="(\?id=[^"]+)"/)[1];
    const result=await open(retry,slug=>({data:{title_ar:slug}}));
    assert.match(result.html,/<h1>a&amp;b<\/h1>/);
  }
});
test('missing project has a return link without retry',async()=>{
  for(const search of ['', '?id=absent']){
    const {html}=await open(search,()=>({data:null,error:null}));
    assert.match(html,/لم يُعثر/);
    assert.match(html,/index.html#research/);
    assert.doesNotMatch(html,/إعادة المحاولة/);
  }
});
test('storage denial still allows an English result or retry',async()=>{
  const blocked=()=>{throw Error('storage');};
  assert.match((await open('?id=ok',()=>({data:{title_en:'Example'}}),blocked)).html,/<h1>Example<\/h1>/);
  const {html,dir}=await open('?id=ok',null,blocked);
  assert.equal(dir,'ltr');
  assert.match(html,/Try again/);
});

test('research details show each available translation when the preferred field is blank', async () => {
  const data = {title_ar:'عنوان', title_en:'   ', subtitle_en:'Subtitle',
    summary_ar:'ملخص', summary_en:'Summary', abstract_ar:'نص <أولي>'};
  for (const lang of ['ar', 'en']) {
    const result = await open('?id=sample', () => ({data}), () => lang);
    assert.match(result.html, /<h1>عنوان<\/h1>/);
    assert.match(result.html, /<h2>Subtitle<\/h2>/);
    assert.ok(result.html.includes('<p class="lead">' + (lang === 'ar' ? 'ملخص' : 'Summary') + '</p>'));
    assert.match(result.html, /نص &lt;أولي&gt;/);
    assert.equal(result.dir, lang === 'ar' ? 'rtl' : 'ltr');
  }
});

test('an untitled project has a localized heading without inventing an abstract', async () => {
  for (const [lang, title] of [['ar', 'مشروع بحثي'], ['en', 'Research project']]) {
    const result = await open('?id=sample', () => ({data:{}}), () => lang);
    assert.ok(result.html.includes('<h1>' + title + '</h1>'));
    assert.doesNotMatch(result.html, /<h2>/);
  }
});
