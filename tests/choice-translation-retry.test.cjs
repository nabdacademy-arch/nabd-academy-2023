const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');

test('translation retries, cached toggles and late replies', async () => {
  const nodes = new Map();
  function element() {
    return {classList:{toggle() {}}, style:{}, setAttribute(k,v){this[k]=v;},
      append(){}, replaceChildren(){}, addEventListener(k,fn){this[k]=fn;}};
  }
  function get(id) {
    if (!nodes.has(id)) nodes.set(id,element());
    return nodes.get(id);
  }
  const pending = [];
  const context = vm.createContext({
    document:{getElementById:get, createElement:element, querySelector:()=>null},
    window:{OpenDoorsChoiceBank:{SOURCES:Object.fromEntries(['chemistry','biology','medicine'].map(s=>[s,{}]))}},
    createClient:()=>({functions:{invoke:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}})
  });
  const source = fs.readFileSync(require.resolve('../assets/js/open-doors-choice.js'),'utf8');
  vm.runInContext(source.replace(/^import .*$/m,''), context);
  const run = s=>vm.runInContext(s,context);
  run("const ctx=sessions.single; const deck=id=>({q:{id, dbId:id, options:['a','b'],subject:'biology'},order:[0,1]});ctx.questions=[deck(1),deck(2)];showExam(ctx)");
  const button=get('choiceSingleTranslate');
  const reply={data:{ok:true,translation:{question_ar:'سؤال',options_ar:['أ','ب']}}};
  let waiting=button.click();
  pending.shift().reject(Error('offline'));
  await waiting;
  assert.equal(button.disabled,false);
  assert.equal(button['aria-pressed'],'false');
  assert.match(get('choiceSingleStatus').textContent,/retry/);
  waiting=button.click();
  pending.shift().resolve({data:{ok:true,translation:{question_ar:'سؤال',options_ar:['أ','']}}});
  await waiting;
  assert.equal(button['aria-pressed'],'false');
  waiting=button.click();
  pending.shift().resolve(reply);
  await waiting;
  assert.equal(get('choiceSinglePromptArabic').textContent,'سؤال');
  await button.click();
  assert.equal(button['aria-pressed'],'false');
  await button.click();
  assert.equal(button['aria-pressed'],'true');
  assert.equal(pending.length,0);
  run('ctx.translation.clear();showExam(ctx)');
  const oldRequest=button.click();
  run('ctx.index=1;showExam(ctx)');
  assert.equal(button.disabled,false);
  const newRequest=button.click();
  pending.shift().resolve(reply);
  await oldRequest;
  assert.equal(button.disabled,true);
  assert.equal(button['aria-pressed'],'false');
  pending.shift().resolve(reply);
  await newRequest;
  assert.equal(button.disabled,false);
  assert.equal(button['aria-pressed'],'true');
});
