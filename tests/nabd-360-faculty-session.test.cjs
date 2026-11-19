const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/nabd-360-student.js'), 'utf8');
const flush = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes,no) => { resolve=yes; reject=no; });
  return {promise, resolve, reject};
}
function page(read, write, identify) {
  const nodes = new Map();
  function node() {
    return {children:[], handlers:{}, dataset:{}, value:'', classList:{toggle(){}},
      append(...items){this.children.push(...items)}, replaceChildren(...items){this.children=items},
      addEventListener(name,fn){this.handlers[name]=fn},
      reset(){for(const el of nodes.values()){el.value='';el.checked=false}}};
  }
  function get(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)}
  let listener, user='a';
  const db = {auth:{
    onAuthStateChange(fn){listener=fn},
    getUser:identify || (async () => ({data:{user:{id:user}}}))
  }, from(){
    const q={select:()=>q, eq:()=>q, maybeSingle:()=>read(user), insert:()=>q, single:()=>write(user)};
    return q;
  }};
  vm.runInNewContext(source,{document:{body:{dataset:{n360:'faculty'}}, documentElement:{},
    getElementById:get,createElement:node,querySelectorAll:()=>[]},
    window:{NABD_CONFIG:{supabaseUrl:'local',supabaseAnonKey:'test'},supabase:{createClient:()=>db}},
    setTimeout:fn=>queueMicrotask(fn)});
  return {get, signOut:()=>listener('SIGNED_OUT'), signIn(id){user=id;listener('SIGNED_IN',{user:{id}})},
    submit(){
      for(const [id,value] of Object.entries({hours:'2', email:'a@example.invalid',topic:'Teaching anatomy'}))get('n360-'+id).value=value;
      get('n360-consent').checked=true;
      get('n360-faculty-form').handlers.submit({preventDefault(){}});
    }};
}
const row = id => ({data:{id:'request',applicant_id:id,status:'pending',expertise:'Teaching'}});
test('current lecturer can submit and see a confirmed application',async()=>{
  const p=page(async()=>({data:null}),async()=>row('a'));
  await flush();
  assert.equal(p.get('n360-application').hidden,false);
  p.submit();await flush();
  assert.equal(p.get('n360-application-status').hidden,false);
  assert.match(p.get('n360-auth').textContent,/حُفظ/);
});
test('sign-out invalidates a pending identity check or application read',async()=>{
  for(const phase of ['identity','read']){
    const wait=deferred();
    const p=page(()=>wait.promise,null,phase==='identity'?()=>wait.promise:undefined);
    await flush();p.signOut();
    wait.resolve(phase==='identity'?{data:{user:{id:'a'}}}:row('a'));
    await flush();
    assert.equal(p.get('n360-application').hidden,true);
    assert.equal(p.get('n360-application-status').hidden,true);
    assert.match(p.get('n360-auth').textContent,/سجّل الدخول/);
    assert.equal(p.get('n360-application-data').children.length,0);
  }
});
test('switching lecturer clears entries and isolates pending saves and errors',async()=>{
  for(const success of [true,false]){
    const old=deferred(),current=deferred();
    const p=page(async()=>({data:null}),id=>id==='a'?old.promise:current.promise);
    await flush();p.submit();p.signIn('b');
    assert.equal(p.get('n360-email').value,'');
    await flush();p.submit();
    if(success)old.resolve(row('a'));else old.reject(new Error('offline'));
    await flush();
    assert.equal(p.get('n360-apply-submit').disabled,true);
    assert.equal(p.get('n360-application-status').hidden,true);
    current.resolve(row('b'));await flush();
    assert.equal(p.get('n360-application-status').hidden,false);
  }
});
