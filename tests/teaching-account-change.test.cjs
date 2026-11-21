const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('teaching studio rechecks permissions when the signed-in account changes',async()=>{
  const elements=new Map();
  function el(id){
    if(!elements.has(id))elements.set(id,{
      value:'',elements:{id:{value:''}},reset(){this.value='';},addEventListener(){}
    });
    return elements.get(id);
  }
  let userId='admin', change, reads=0, rejectIdentity=false, pendingRows;
  const timers=[];
  const db={
    auth:{onAuthStateChange(fn){change=fn;},async getUser(){
      reads++;
      if(rejectIdentity)throw Error('offline');
      return {data:{user:{id:userId}}};
    }},
    rpc:async()=>({data:userId==='admin'}),
    from(table){return {
      select(){return this;},
      order(){return table==='nabd_teaching_records'?this:Promise.resolve({data:[]});},
      range(){return new Promise(resolve=>{pendingRows=resolve;});}
    };}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/lecturers.js'),'utf8'),{
    window:{nabdSupabase:db},document:{getElementById:el},setTimeout:fn=>timers.push(fn),
    console:{error(){}}
  });
  await tick();
  assert.equal(el('studio-admin').hidden,false);
  const oldRows=pendingRows;
  el('studio-record').elements.id.value='old draft';
  change('SIGNED_IN',{user:{id:'admin'}});
  assert.equal(timers.length,0);
  userId='student';
  change('SIGNED_IN',{user:{id:userId}});
  assert.equal(el('studio-workspace').hidden,true);
  assert.equal(el('studio-admin').hidden,true);
  assert.equal(el('studio-record').elements.id.value,'');
  assert.equal(reads,1);
  timers.shift()();
  await tick();
  assert.equal(el('studio-workspace').hidden,false);
  assert.equal(el('studio-admin').hidden,true);
  assert.equal(el('studio-editor').hidden,true);
  pendingRows({data:[]});await tick();
  const display=el('studio-records').innerHTML;
  oldRows({data:[{id:'old',title:'private'}]});await tick();
  assert.equal(el('studio-records').innerHTML,display);
  userId='other';rejectIdentity=true;
  change('SIGNED_IN',{user:{id:userId}});timers.shift()();await tick();
  assert.equal(el('studio-workspace').hidden,true);
  assert.equal(el('studio-login').hidden,false);
  change('SIGNED_IN',{user:{id:'last'}});change('SIGNED_OUT',null);
  const count=reads;timers.shift()();await tick();
  assert.equal(reads,count);
  assert.equal(el('studio-workspace').hidden,true);
});
