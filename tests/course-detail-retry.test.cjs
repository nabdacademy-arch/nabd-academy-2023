const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/course.js'), 'utf8');

function page({lookup, language=()=>'en', search='?id=sample'}) {
  let retry,expire,reloaded=false;
  const box = {querySelector:()=>({addEventListener:(event,fn)=>{retry=fn}})};
  const document = {documentElement:{},getElementById:()=>box};
  const client = lookup && {from(table){
    assert.equal(table,'courses');
    return {select:()=>({eq:(field,id)=>({abortSignal:signal=>({maybeSingle:()=>lookup(field,id,signal)})})})};
  }};
  const ready = vm.runInNewContext(source,{window:{nabdSupabase:client},document,AbortController,URLSearchParams,
    location:{search,reload:()=>{reloaded=true}},localStorage:{getItem:language},
    setTimeout(fn){expire=fn;return 1},clearTimeout(){}});
  return {ready,document,box,retry:()=>retry(),expire:()=>expire(),reloaded:()=>reloaded};
}
const row={slug:'sample',title_en:'Example',title_ar:'مثال',modules:[]};

test('transient failures can retry the same course in Arabic',async()=>{
  for(const fail of [()=>({error:{message:'db error'}}),()=>Promise.reject(new Error('offline'))]){
    let calls=0;
    const p=page({language:()=>'ar',lookup(field,id){
      assert.equal(field,'slug');assert.equal(id,'sample');
      return ++calls===1?fail():{data:row};
    }});
    await p.ready;
    assert.equal(p.document.documentElement.dir,'rtl');
    assert.match(p.box.innerHTML,/إعادة المحاولة/);
    await p.retry();
    assert.match(p.box.innerHTML,/مثال/);
    assert.match(p.box.innerHTML,/enroll.html\?course=sample/);
    assert.equal(calls,2);
  }
});
test('timeout ends the loading state; missing SDK retries page initialization',async()=>{
  const p=page({lookup:(field,id,signal)=>new Promise(resolve=>signal.addEventListener('abort',()=>resolve({error:true})))});
  p.expire();await p.ready;
  assert.match(p.box.innerHTML,/Try again/);
  const missing=page({});await missing.ready;missing.retry();assert.ok(missing.reloaded());
});
test('successful empty lookup and incomplete link have separate outcomes',async()=>{
  const empty=page({lookup:()=>({data:null})});await empty.ready;
  assert.match(empty.box.innerHTML,/No available course/);
  assert.doesNotMatch(empty.box.innerHTML,/Try again/);
  const noId=page({search:'',lookup:()=>assert.fail('unexpected lookup')});await noId.ready;
  assert.match(noId.box.innerHTML,/Incomplete course link/);
});
test('blocked preference storage still permits a successful lookup',async()=>{
  const p=page({language:()=>{throw Error('blocked')},lookup:()=>({data:row})});await p.ready;
  assert.match(p.box.innerHTML,/Example/);assert.equal(p.document.documentElement.dir,'ltr');
});

test('course details use available translations field by field in both languages', async () => {
  const data = {...row, title_en:'  ', title_ar:'عنوان الدورة', description_en:'English summary',
    description_ar:'الملخص العربي', level_en:null, level_ar:'مبتدئ'};
  for (const lang of ['en', 'ar']) {
    const p = page({language:() => lang, lookup:() => ({data})});
    await p.ready;
    assert.match(p.box.innerHTML, /<h1>عنوان الدورة<\/h1>/);
    assert.match(p.box.innerHTML, /<strong>مبتدئ<\/strong>/);
    assert.ok(p.box.innerHTML.includes(lang === 'en' ? data.description_en : data.description_ar));
    assert.equal(p.document.title, 'عنوان الدورة | NABD Academy');
  }
});

test('a course without a title in either language gets a localized heading', async () => {
  for (const [lang, heading] of [['ar', 'دورة'], ['en', 'Course']]) {
    const p = page({language:() => lang, lookup:() => ({data:{slug:'sample'}})});
    await p.ready;
    assert.equal(p.document.title, heading + ' | NABD Academy');
    assert.ok(p.box.innerHTML.includes('<h1>' + heading + '</h1>'));
  }
});
