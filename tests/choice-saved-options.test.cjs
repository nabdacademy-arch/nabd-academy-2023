const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('incomplete saved options stay in English and a complete retry is cached', async () => {
  const nodes = new Map();
  function element() {
    return {style:{}, classList:{toggle(){}}, append(){}, replaceChildren(){},
      setAttribute(key,value){this[key]=value;}, addEventListener(key,fn){this[key]=fn;}};
  }
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  }
  let reads = 0;
  const options = [['أ', '  '], ['أ', null], ['أ', 'ب']];
  const query = {select(){return this;}, eq(){return this;}, maybeSingle(){
    return {data:{question_ar:'سؤال', options_ar:options[reads++]}};
  }};
  const context = vm.createContext({
    document:{getElementById:get, createElement:element, querySelector:()=>null},
    window:{OpenDoorsChoiceBank:{SOURCES:{biology:{},chemistry:{},medicine:{}}}},
    sdk:{createClient:()=>({from:()=>query})}
  });
  const source = fs.readFileSync(require.resolve('../assets/js/open-doors-choice.js'), 'utf8');
  vm.runInContext(source.replace(/import\("https:[^"]+"\)/, 'Promise.resolve(sdk)'), context);
  vm.runInContext("sessions.single.questions=[{q:{id:'fixture',dbId:'fixture',subject:'biology',options:['A','B']},order:[0,1]}];showExam(sessions.single)", context);
  const button = get('choiceSingleTranslate');
  for (let i=0; i<2; i++) {
    await button.click();
    assert.equal(button['aria-pressed'], 'false');
    assert.equal(button.disabled, false);
    assert.equal(get('choiceSinglePromptArabic').hidden, true);
  }
  await button.click();
  assert.equal(button['aria-pressed'], 'true');
  assert.equal(get('choiceSinglePromptArabic').textContent, 'سؤال');
  await button.click();
  await button.click();
  assert.equal(reads, 3);
  assert.equal(button['aria-pressed'], 'true');
});
