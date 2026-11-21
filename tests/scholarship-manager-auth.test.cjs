const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../scholarship-manager.html'), 'utf8');
const source = fs.readFileSync(require.resolve('../assets/js/scholarship-center.js'), 'utf8');

function manager(createClient) {
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, {handlers:{}, replaceChildren(){}, append(){}, classList:{add(){},remove(){}},
      addEventListener(event, fn){this.handlers[event]=fn}});
    return nodes.get(id);
  }
  const window = {NABD_CONFIG:{supabaseUrl:'https://test.invalid',supabaseAnonKey:'test'},supabase:{createClient}};
  Object.defineProperty(window, 'nabdSupabase', {get(){throw new Error('Unexpected access to student session')}});
  vm.runInNewContext(source, {window, URL, location:{href:'https://test.invalid/scholarship-manager.html'},
    document:{querySelector:key=>key==='[data-scholarship-manager]'?{}:null,getElementById:get,createElement:()=>({})}});
  return get;
}

test('manager recovery uses only the dedicated client', async()=>{
  assert.doesNotMatch(html,/src="[^"]*supabase-client\.js/);
  let listener, options, reset;
  const get = manager((url,key,config)=>{
    options=config.auth;
    return {auth:{
      onAuthStateChange(fn){listener=fn},
      async getUser(){return {data:{user:null}}},
      async resetPasswordForEmail(email,{redirectTo}){reset={email,redirectTo};return {}}
    }};
  });
  await new Promise(setImmediate);
  assert.equal(options.storageKey,'nabd-scholarships-manager-auth-v1');
  assert.equal(options.detectSessionInUrl,true);
  get('sch-email').value='staff@example.invalid';
  await get('sch-reset-password').handlers.click();
  assert.deepEqual(reset,{email:'staff@example.invalid',redirectTo:'https://test.invalid/scholarship-manager.html'});
  listener('PASSWORD_RECOVERY');
  assert.equal(get('sch-new-password-panel').hidden,false);
  assert.equal(get('sch-dashboard').hidden,true);
});

test('unavailable or failed staff client prevents login and recovery',()=>{
  for(const create of [undefined,()=>{throw Error('Unavailable')}]){
    const get=manager(create);
    assert.equal(get('sch-login-button').disabled,true);
    assert.equal(get('sch-reset-password').disabled,true);
    assert.match(get('sch-auth-status').textContent,/أعد تحميل/);
    let prevented=false;
    get('sch-login-form').handlers.submit({preventDefault(){prevented=true}});
    assert.ok(prevented);
  }
});

for(const outcome of ['active','inactive','signed-out']){
  test('publisher verification after an interrupted lookup: '+outcome,async()=>{
    let calls=0, signOuts=0, privateReads=0, finish, authChange;
    const get=manager(()=>({
      auth:{getUser:async()=>({data:{user:{id:'fixture'}}}),
        onAuthStateChange(fn){authChange=fn;},signOut:async()=>{signOuts++;return {};}},
      from(table){
        if(table==='nabd_scholarship_opportunities')privateReads++;
        return {select(){return this;},eq(){return this;},order(){return this;},limit:async()=>({data:[]}),
          async maybeSingle(){
            calls++;
            if(calls===1)return {error:{message:'unavailable'}};
            if(calls===2)throw Error('connection lost');
            return new Promise(resolve=>{finish=resolve;});
          }};
      }
    }));
    await new Promise(setImmediate);
    const retry=get('sch-retry-role'), dashboard=get('sch-dashboard');
    assert.equal(dashboard.hidden,true);
    assert.equal(retry.hidden,false);
    await retry.handlers.click();
    assert.equal(signOuts,0);
    assert.equal(privateReads,0);
    assert.equal(retry.hidden,false);
    const waiting=retry.handlers.click();
    await retry.handlers.click();
    await new Promise(setImmediate);
    assert.equal(calls,3);
    if(outcome==='signed-out')authChange('SIGNED_OUT');
    finish({data:{active:outcome!=='inactive'}});
    await waiting;
    assert.equal(dashboard.hidden,outcome!=='active');
    assert.equal(privateReads,outcome==='active'?1:0);
    assert.equal(signOuts,outcome==='inactive'?1:0);
  });
}
