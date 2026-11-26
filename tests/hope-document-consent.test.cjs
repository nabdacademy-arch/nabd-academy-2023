const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'nabd-hope.html'), 'utf8');
const script = html.match(/src="([^"?]*nabd-hope-applications\.js)/)[1];
const source = fs.readFileSync(path.join(root, script), 'utf8');

function page(lang, consent, fileType = 'application/pdf') {
  const nodes = new Map();
  const calls = [];
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      hidden:false, value:'sample', dataset:{}, listeners:{},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      checkValidity:()=>true, replaceChildren(){}, reset(){}, scrollIntoView(){}
    });
    return nodes.get(id);
  }
  const doc = {getElementById:element, querySelectorAll:()=>[], querySelector:()=>null,
    createElement:()=>({}), head:{append(){}}, documentElement:{lang}};
  class File {size=16; type=fileType;}
  class FormData extends Map {
    constructor() {
      super([['document', new File()], ['number','123456789'], ['issuer','PS'], ['kind','national_id']]);
      if (consent !== undefined) this.set('consent',consent);
    }
  }
  const query = {select(){return this;}, eq(){return this;}, async single(){return {data:{registration_open:true}};}};
  const window = {supabase:{createClient:()=>({from:()=>query})},
    turnstile:{render(selector,options){options.callback('sample-token');return selector;},reset(){}}};
  vm.runInNewContext(source,{window,document:doc,File,FormData,fetch:async (url,options)=>{
    calls.push(options.body);
    return {ok:true,json:async()=>({ok:true,state:'submitted'})};
  }});
  element('hope-verify-next').listeners.click();
  return {calls, submit:()=>element('hope-verification-form').listeners.submit({preventDefault(){}}),
    message:()=>element('hope-verify-message').textContent};
}

test('verification form requires a fresh unchecked consent checkbox',()=>{
  const form = html.match(/<form[^>]*id="hope-verification-form"[\s\S]*?<\/form>/)[0];
  const input = form.match(/<input[^>]*name="consent"[^>]*>/)[0];
  assert.match(input,/type="checkbox"/);
  assert.match(input,/\brequired\b/);
  assert.doesNotMatch(input,/\b(?:checked|value)\s*[=> ]/);
});

for (const lang of ['ar','en']) {
  test(lang + ': absent or unexpected consent prevents upload, explicit consent permits one request',async()=>{
    for (const choice of [undefined,'off','on']) {
      const view = page(lang,choice);
      await view.submit();
      if (choice === 'on') {
        assert.equal(view.calls.length,1);
        assert.equal(view.calls[0].get('consent'),'yes');
        assert.match(view.message(),lang==='ar'?/تم استلام الوثيقة/:/Document received/);
      } else {
        assert.equal(view.calls.length,0);
        assert.match(view.message(),lang==='ar'?/مربع الموافقة/:/consent checkbox/);
      }
    }
  });
}

for (const lang of ['ar','en']) {
  test(lang + ': rejects unsupported or undeclared file types before upload',async()=>{
    for (const type of ['image/heic','text/plain','']) {
      const view = page(lang,'on',type);
      await view.submit();
      assert.equal(view.calls.length,0);
      assert.match(view.message(),/PDF/);
    }
  });
  test(lang + ': sends PDF, JPEG and PNG documents',async()=>{
    for (const type of ['application/pdf','image/jpeg','image/png']) {
      const view = page(lang,'on',type);
      await view.submit();
      assert.equal(view.calls.length,1);
      assert.equal(view.calls[0].get('document').type,type);
    }
  });
}
