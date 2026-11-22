const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/learning-admin.js'),'utf8');

async function openPanel(update, admin=true){
  let module;
  vm.runInNewContext(source,{window:{NABD_ADMIN_REGISTER_MODULE:entry=>{module=entry}}});
  const status={};
  const panel={isConnected:true,querySelector:()=>status};
  const db={rpc:async()=>({data:admin}),from(table){
    const list={select:()=>list,eq:()=>list,order:()=>list,limit:async()=>({data:[]})};
    list.update=values=>{
      assert.equal(table,'nabd_learning_posts');
      const filters={};
      const query={eq(key,value){filters[key]=value;return query},select:()=>query,
        maybeSingle:()=>update(filters,values.status)};
      return query;
    };
    return list;
  }};
  await module.render(panel,{db,user:{id:'director'}});
  const controls=['approved','rejected'].map(decision=>({dataset:{decision,laPost:'post'},hasAttribute:()=>false,
    closest:selector=>selector==='article'?article:null}));
  const article={removed:false,querySelectorAll:()=>controls,remove(){this.removed=true}};
  return {status,controls,article,click:i=>panel.onclick({target:{closest:()=>controls[i]}})};
}

test('first confirmed decision survives a conflicting review in another window',async()=>{
  let stored='pending';
  const update=async(filters,next)=>{
    assert.deepEqual(filters,{id:'post',status:'pending'});
    if(stored!==filters.status)return {data:null};
    stored=next;return {data:{id:'post',status:stored}};
  };
  const first=await openPanel(update),second=await openPanel(update);
  await first.click(0);await second.click(1);
  assert.equal(stored,'approved');
  assert.ok(first.article.removed);
  assert.match(first.status.textContent,/تم اعتماد/);
  assert.equal(second.article.removed,false);
  assert.match(second.status.textContent,/حدّث السجلات/);
  assert.ok(second.controls.every(button=>button.disabled));
});

test('both decisions lock while saving; network failure allows manual retry',async()=>{
  let reject,calls=0;
  const p=await openPanel(()=>++calls===1?new Promise((_,fail)=>{reject=fail}):{data:{id:'post',status:'rejected'}});
  const pending=p.click(1);await p.click(0);
  assert.equal(calls,1);
  reject(new Error('offline'));await pending;
  assert.ok(p.controls.every(button=>!button.disabled));
  assert.equal(p.article.removed,false);
  await p.click(1);
  assert.match(p.status.textContent,/تم رفض/);
  assert.equal(p.article.removed,true);
});
