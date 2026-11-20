const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.resolve(__dirname, '../assets/js/quality-director.js'), 'utf8');
const grading = code.slice(code.indexOf('function displayChoice'), code.indexOf('$("ql-close-grading").addEventListener'));
async function review(answers) {
  class Node {
    constructor(text) { this.text = text; this.children = []; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    querySelector() { return new Node(); }
    scrollIntoView() {}
  }
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id,new Node()); return nodes.get(id); };
  const row = { answers, student_id:'fixture', human_score:null };
  const client = { from() { return {
    select() { return this; }, eq() { return this; }, order() { return this; },
    limit:async()=>({data:[row]}), in:async()=>({data:[]})
  }; } };
  const ctx = vm.createContext({ client, $:get, el:(_,cls,text)=>new Node(text),
    isoDate:()=>'', field:()=>new Node(), btn:()=>new Node() });
  vm.runInContext(grading,ctx);
  await ctx.showGrading({id:'paper',title:'Demo',questions:[
    {id:'q',type:'mcq',options:['one','two']},
    {id:'m',type:'matching',left_items:['a','b','c'],right_items:['x','y','z']}
  ]});
  const answerBlock = get('ql-submissions').children[0].children[2];
  return answerBlock.children.map(question=>question.children[0].text);
}
test('zero and older numeric strings display the actual selected options',async()=>{
  assert.deepEqual(await review({q:0,m:['0',1,2]}),['الخيار A','عنصر 1: 1، عنصر 2: 2، عنصر 3: 3']);
  assert.equal((await review({q:'1'}))[0],'الخيار B');
});
test('blank and missing answers never display as the first option',async()=>{
  assert.deepEqual(await review({q:null,m:[null,0]}),['لم يُجب','عنصر 1: لم يُجب، عنصر 2: 1، عنصر 3: لم يُجب']);
  assert.deepEqual(await review({q:''}),['لم يُجب','لم يُجب']);
});
test('invalid stored choices are distinguished from skipped answers',async()=>{
  assert.deepEqual(await review({q:false,m:[-1,5,'bad']}),['قيمة غير معروفة','عنصر 1: قيمة غير معروفة، عنصر 2: قيمة غير معروفة، عنصر 3: قيمة غير معروفة']);
});
