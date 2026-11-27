const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../nabd-hope.html'), 'utf8');
const script = html.match(/src="([^"?]*nabd-hope-applications\.js)/)[1];
const source = fs.readFileSync(require.resolve('../' + script), 'utf8');
const pattern = html.match(/<input name="phone"[^>]*pattern="([^"]+)"/)[1];
const valid = new RegExp('^(?:' + pattern + ')$', 'v');

test('phone field accepts supported digits and retains length and format limits', () => {
  for (const number of ['1234567', '+٩٧٠٥٩١٢٣٤٥٦٧', '۰۱۲۳۴۵۶', '+123٤٥۶۷']) {
    assert.ok(valid.test(number), number);
  }
  for (const number of ['۱۲۳', '1234567890123456', '123 4567', '12+34567', '123456A']) {
    assert.equal(valid.test(number), false, number);
  }
});

test('submit sends the ASCII equivalent including leading zero and optional plus', async () => {
  for (const [phone, expected] of [['٠٥۹۱۲۳۴۵۶۷', '0591234567'], ['+٩٧٠٥٩١٢٣٤٥٦٧', '+970591234567'], ['0591234567','0591234567']]) {
    const nodes = new Map();
    function node(id) {
      if (!nodes.has(id)) nodes.set(id, {dataset:{}, listeners:{}, scrollIntoView(){}, replaceChildren(){},
        addEventListener(event, fn){this.listeners[event] = fn;}});
      return nodes.get(id);
    }
    let sent;
    const query = {select(){return this;}, eq(){return this;}, async single(){return {data:{registration_open:true}};}};
    vm.runInNewContext(source, {
      document:{documentElement:{lang:'ar'}, getElementById:node, querySelectorAll:()=>[], querySelector:()=>null,
        createElement:()=>({}), head:{append(){}}},
      window:{supabase:{createClient:()=>({from:()=>query})}, turnstile:{render(id, opts){opts.callback('test');return id;}, reset(){}}},
      FormData:class {get(key){return key === 'phone' ? phone : 'sample';} getAll(){return ['device'];}},
      crypto:{randomUUID:()=>'test-code'},
      fetch:async (url, opts)=>{sent = JSON.parse(opts.body);return {ok:true,json:async()=>({error:'INVALID_INPUT'})};}
    });
    await new Promise(resolve=>setImmediate(resolve));
    node('hope-apply-button').listeners.click();
    await node('hope-form').listeners.submit({preventDefault(){},target:node('hope-form')});
    assert.equal(sent.action, 'submit');
    assert.equal(sent.phone, expected);
  }
});
