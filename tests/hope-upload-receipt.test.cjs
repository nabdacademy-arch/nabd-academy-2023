const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/nabd-hope-applications.js'), 'utf8');

function page(lang, online, responses) {
  const nodes = new Map();
  const calls = [];
  const captcha = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      hidden:false, value:'sample', dataset:{}, listeners:{},
      addEventListener(event, fn) { this.listeners[event] = fn; },
      checkValidity:()=>true, append(){}, replaceChildren(){}, reset(){}, scrollIntoView(){}
    });
    return nodes.get(id);
  }
  const doc = {getElementById:element, querySelectorAll:()=>[], querySelector:()=>null,
    createElement:()=>({setAttribute(){},append(){}}), head:{append(){}}, documentElement:{lang}};
  class File {size=16;}
  class FormData extends Map {
    constructor() {
      super([['document', new File()], ['number','123456789'], ['issuer','PS'], ['kind','national_id']]);
      this.set('consent','on');
    }
  }
  const query = {select(){return this;}, eq(){return this;}, async single(){return {data:{registration_open:true}};}};
  const window = {supabase:{createClient:()=>({from:()=>query})},
    turnstile:{render(selector,options){captcha.set(selector,options.callback);options.callback('sample-token');return selector;},reset(){}}};
  vm.runInNewContext(source,{window,navigator:{onLine:online},document:doc,File,FormData,fetch:async (url,options)=>{
    calls.push(options.body);
    const reply=responses.shift();
    if (!reply) throw new TypeError('offline');
    return {ok:true,json:async()=>reply};
  }});
  element('hope-verify-next').listeners.click();
  return {calls, element, completeVerification:()=>captcha.get('#hope-verify-captcha')('fresh-token'), lookup:()=>element('hope-lookup-form').listeners.submit({preventDefault(){}}), submit:()=>element('hope-verification-form').listeners.submit({preventDefault(){}}),
    message:()=>element('hope-verify-message').textContent};
}


for (const lang of ['ar','en']) {
  test(lang + ': no upload starts while offline', async () => {
    const view = page(lang, false, []);
    await view.submit();
    assert.equal(view.calls.length, 0);
    assert.match(view.message(),lang==='ar'?/لم يبدأ رفع/:/has not started/);
  });
  for (const state of ['missing','submitted']) {
    test(lang + ': lookup resolves lost acknowledgement as ' + state, async () => {
      const view = page(lang, true, [null,{found:true,verification:state},{ok:true,state:'submitted'}]);
      await view.submit();
      assert.match(view.element('hope-verification-status').textContent,
        lang==='ar'?/تعذّر تأكيد/:/unconfirmed/);
      await view.submit();
      assert.equal(view.calls.length,1);
      await view.lookup();
      assert.equal(view.calls.length,2);
      assert.equal(JSON.parse(view.calls[1]).action,'lookup');
      assert.equal(view.element('hope-verification-form').hidden,state==='submitted');
      view.completeVerification();
      await view.submit();
      assert.equal(view.calls.length,state==='missing'?3:2);
      assert.equal(view.element('hope-verification-form').hidden,true);
    });
  }
  test(lang + ': successful receipt marks the document submitted', async () => {
    const view = page(lang, true, [{ok:true,state:'submitted'}]);
    await view.submit();
    assert.match(view.message(),lang==='ar'?/تم استلام الوثيقة/:/Document received/);
    assert.equal(view.element('hope-verification-form').hidden,true);
  });
}
