import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source = readFileSync(new URL("../atlas/clinical-hub.mjs", import.meta.url), "utf8");
function section(start, end) {
  return source.slice(source.indexOf("function " + start + "("), source.indexOf("function " + end + "("));
}
function session(storage) {
  const nodes = new Map();
  const node = () => ({replaceChildren(){}, append(){}, addEventListener(){}});
  const context = {
    localStorage: storage, current: {id:"practice", steps:[{options:[{points:1}]}]},
    picks:[0], stepIndex:0, selectedAnswer:0, lastRecorded:null, replayBefore:null,
    validateCase:()=>true, renderReferences(){}, renderStep(){}, LAST_CASE_KEY:"last", HISTORY_KEY:"history", DRAFT_KEY:"draft", tr:key=>key, tx:value=>value,
    isFinished:()=>true, grade:()=>({score:1,maxPoints:1}), document:{createElement:node},
    renderCaseHeader(){}, renderProgress(){}, renderSkillReport(){}, renderHistory(){}, renderCatalog(){},
    $: id => {
      if(!nodes.has(id)) nodes.set(id,node());
      return nodes.get(id);
    }
  };
  context.clinicalCases=[context.current];
  runInNewContext([section("safeRead","safeWrite"),source.match(/function safeWrite[^\n]+/)[0],
    section("readDraft","warning"), section("activateCase","renderStep"), section("warning","saveDraft"), section("clearDraft","renderHistory"),
    section("proceed","renderSkillReport"), section("renderReport","exportAttempt")].join("\n"),context);
  context.activateCase("practice");
  return {finish:()=>context.proceed(), nodes};
}
for(const initiallyFull of [false,true]){
  test(initiallyFull ? "failed history save preserves draft across reopening" : "successful completion saves once and removes only this draft",()=>{
    const values = new Map([["draft",JSON.stringify({practice:{step:0,picks:[0]},other:{step:1}})]]);
    let full=initiallyFull;
    const storage={getItem:key=>values.get(key)??null,setItem(key,value){
      if(full && key==="history") throw new Error("quota");
      values.set(key,value);
    }};
    let page=session(storage);
    page.finish();
    if(full){
      assert.equal(values.has("history"),false);
      assert.deepEqual(JSON.parse(values.get("draft")).practice,{step:0,picks:[0]});
      assert.equal(page.nodes.get("storageWarning").textContent,"saveWarning");
      assert.equal(page.nodes.get("finalScore").textContent,"1 / 1");
      full=false;
      page=session(storage);
      page.finish();
    }
    page.finish();
    const history=JSON.parse(values.get("history"));
    assert.equal(history.length,1);
    assert.deepEqual(history[0].answers,[0]);
    assert.deepEqual(JSON.parse(values.get("draft")),{other:{step:1}});
  });
}
