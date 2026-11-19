import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG} from '../content.mjs';
import {createBackup,PRACTICE_KEY} from '../zero-core.mjs';

test('NABD ZERO import and export respect unreadable device records', async t => {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id,{addEventListener(event, cb){this[event]=cb;}});
    return nodes.get(id);
  }
  let raw = null, writes = 0, blocked = false, full = false, downloads = 0;
  const mock = (key,value) => {
    const old = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(()=>old ? Object.defineProperty(globalThis,key,old) : delete globalThis[key]);
  };
  mock('window',{addEventListener(){},confirm:()=>true});
  mock('navigator',{onLine:false});
  mock('document',{documentElement:{},getElementById:node,querySelectorAll:()=>[],
    createElement:()=>({click(){downloads++;},remove(){}}),body:{append(){}}});
  mock('localStorage',{getItem(key){
    if (key!==PRACTICE_KEY) return '"en"';
    if(blocked) throw Error('denied');
    return raw;
  },setItem(key,value){
    if(full) throw Error('quota');
    writes++; raw=value;
  }});
  await import('../zero.mjs');
  const id=CATALOG.lessons[0].id;
  const payload=createBackup(CATALOG.lessons,{[id]:{completed:true,score:1}});
  const restore=()=>node('import').change({currentTarget:{files:[{size:payload.length,text:async()=>payload}]}});
  for (const invalid of ['', '{', JSON.stringify({[id]:{score:-1}})]) {
    raw=invalid; await restore(); node('export').click();
    assert.equal(raw,invalid); assert.equal(writes,0); assert.equal(downloads,0);
    assert.match(node('backup-message').textContent,/Could not read/);
  }
  raw=null; blocked=true; await restore(); assert.equal(writes,0);
  blocked=false; full=true; await restore(); assert.match(node('backup-message').textContent,/Could not save/);
  full=false; await restore(); assert.equal(writes,1);
  assert.deepEqual(JSON.parse(raw)[id],{score:1,completed:true});
  node('export').click(); assert.equal(downloads,1);
});
