import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {PACKS,PRACTICE_KEY,BACKUP_SCHEMA,readiness,cleanPractice,createBackup,mergeBackup} from '../zero-core.mjs';
import {CATALOG} from '../content.mjs';
const root = new URL('../',import.meta.url);
const file = path => readFileSync(new URL(path,root),'utf8');
const app = file('app.mjs');
const html = file('zero.html');
const learningSW = file('sw.js');
const atlasSW = file('../atlas/sw.js');

function swList(source) {
  const match = source.match(/const FILES\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'service worker asset list');
  return Array.from(runInNewContext(match[1]));
}
test('both published offline pack definitions match their service workers',()=>{
  assert.deepEqual(PACKS.learning.assets,swList(learningSW));
  assert.deepEqual(PACKS.atlas.assets,swList(atlasSW));
  assert.ok(learningSW.includes(PACKS.learning.cache));
  assert.ok(atlasSW.includes(PACKS.atlas.cache));
  for(const name of Object.keys(PACKS)){
    const base = name === 'learning' ? root : new URL('../atlas/',root);
    for(const asset of PACKS[name].assets){
      if(asset === './') continue;
      assert.doesNotThrow(()=>file(new URL(asset,base).href),name+': '+asset);
    }
  }
});
test('readiness rejects missing files instead of trusting cache name',()=>{
  const complete=readiness(['a','b'],['a','b']);
  assert.equal(complete.ready,true);
  assert.equal(complete.saved,2);
  assert.deepEqual(readiness(['a','b'],['a']),{ready:false,saved:1,total:2,missing:['b']});
});
test('practice backup merges scores without importing private data or unknown IDs',()=>{
  const id=CATALOG.lessons[0].id, max=CATALOG.lessons[0].quiz.length;
  const before={[id]:{completed:true,score:max}};
  const json=createBackup(CATALOG.lessons,{[id]:{completed:false,score:1},email:'not-a-lesson'});
  const obj=JSON.parse(json);
  assert.equal(obj.schema,BACKUP_SCHEMA);
  assert.deepEqual(Object.keys(obj.lessons),[id]);
  assert.equal(json.includes('not-a-lesson'),false);
  const merged=mergeBackup(CATALOG.lessons,before,json);
  assert.equal(merged.progress[id].completed,true);
  assert.equal(merged.progress[id].score,max);
  assert.equal(merged.imported,1);
  assert.equal(PRACTICE_KEY,'nabd-learning-practice-v1');
});
test('untrusted imports cannot forge scores, unknown lesson IDs or special keys',()=>{
  const id=CATALOG.lessons[0].id, max=CATALOG.lessons[0].quiz.length;
  const candidate=data=>JSON.stringify({schema:BACKUP_SCHEMA,lessons:data});
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},candidate({[id]:{score:max+1}})));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},candidate({[id]:{score:-1}})));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},candidate({[id]:{completed:'true'}})));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},candidate({'unknown':{score:1}})));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},'x'.repeat(65537)));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},'{invalid'));
  assert.throws(()=>mergeBackup(CATALOG.lessons,{},candidate(JSON.parse('{"__proto__":{"polluted":true}}'))));
  assert.equal({}.polluted,undefined);
  assert.deepEqual(Object.keys(cleanPractice(CATALOG.lessons,{'unknown':{score:5}})),[]);
});
test('NABD ZERO is accessible internally and does not replace homepage',()=>{
  assert.match(app,/href="\.\/zero\.html"/);
  assert.match(app,/PACKS\.learning/);
  assert.doesNotMatch(app,/nabd-learning-public-v1/);
  assert.match(html,/<html lang="ar" dir="rtl">/);
  assert.match(html,/id="audit"/);
  assert.match(html,/id="import"/);
  assert.match(html,/id="learning-status"/);
  assert.match(html,/id="atlas-status"/);
  assert.doesNotMatch(html,/<script[^>]+https?:/);
  assert.match(file('zero.mjs'),/caches\.open/);
  assert.match(file('zero.mjs'),/localStorage\.setItem/);
});
