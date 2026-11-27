import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const app=readFileSync(new URL('../learning/app.mjs',import.meta.url),'utf8');
const toggle=app.slice(app.indexOf('function toggleBookmark('),app.indexOf('function libraryCards('));
for(const lang of ['ar','en']){
 test('bookmark writes and retries in '+lang,()=>{
  let allowed=false, stored=[], focused=false;
  const status={}, topic={value:'all',focus(){focused=true;}};
  const results={querySelector(){return null;}};
  const button={dataset:{bookmark:'sample'},pressed:'false',setAttribute(key,value){assert.equal(key,'aria-pressed');this.pressed=value;}};
  const context={button,bookmarks:[],icon:value=>value,t:(ar,en)=>lang==='ar'?ar:en,
   $:key=>({'bookmark-status':status,'library-topic':topic,'library-results':results})[key],
   libraryCards:()=>'',write:(key,value)=>{assert.equal(key,'nabd-learning-bookmarks');if(allowed)stored=[...value];return allowed;}};
  const click=()=>runInNewContext('toggleBookmark(button)',context);
  runInNewContext(toggle,context);
  click();
  assert.match(status.textContent,lang==='ar'?/تعذّر/:/Try again/);
  assert.equal(button.pressed,'false');
  assert.equal(context.bookmarks.length,0);
  allowed=true;click();
  assert.deepEqual(stored,['sample']);
  assert.equal(button.pressed,'true');
  assert.equal(status.textContent,'');
  topic.value='saved';allowed=false;click();
  assert.deepEqual([...context.bookmarks],['sample']);
  assert.deepEqual(stored,['sample']);
  assert.equal(results.innerHTML,undefined);
  allowed=true;click();
  assert.deepEqual(stored,[]);
  assert.equal(results.innerHTML,'');
  assert.equal(focused,true);
 });
}
