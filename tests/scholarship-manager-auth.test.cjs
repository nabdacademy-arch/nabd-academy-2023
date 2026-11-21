const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../scholarship-manager.html'), 'utf8');
const source = fs.readFileSync(require.resolve('../assets/js/scholarship-center.js'), 'utf8');

function manager(createClient) {
  const nodes = new Map();
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, {handlers:{}, hidden:true, reset(){}, replaceChildren(){}, append(){}, classList:{add(){},remove(){}},
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
  listener('PASSWORD_RECOVERY',{user:{id:'fixture'}});
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

test('recovery requests can be retried after an uncertain response without overlapping sends',async()=>{
  const pending=[];
  const get=manager(()=>({auth:{
    getUser:async()=>({data:{user:null}}),onAuthStateChange(){},
    resetPasswordForEmail:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))
  }}));
  await new Promise(setImmediate);
  const email=get('sch-email'), button=get('sch-reset-password'), status=get('sch-auth-status');
  email.value='';
  await button.handlers.click();
  assert.equal(pending.length,0);
  email.value='staff@example.invalid';
  const first=button.handlers.click();
  await button.handlers.click();
  assert.equal(pending.length,1);
  pending.shift().reject(Error('offline'));
  await first;
  assert.equal(button.disabled,false);
  assert.match(status.textContent,/تفقد بريدك/);
  const retry=button.handlers.click();
  pending.shift().resolve({error:{status:503}});
  await retry;
  assert.match(status.textContent,/قبل إعادة المحاولة/);
  const changed=button.handlers.click();
  email.value='other@example.invalid';email.handlers.input();
  pending.shift().resolve({error:null});
  await changed;
  assert.equal(status.textContent,'');
  const last=button.handlers.click();
  pending.shift().resolve({error:null});
  await last;
  assert.match(status.textContent,/إذا كان البريد مسجلًا/);
  assert.equal(button.disabled,false);
});

test('password changes stay with the recovery session and retry after network failure',async()=>{
  let notify, sessionId, writes=0, complete;
  const get=manager(()=>({auth:{
    onAuthStateChange(fn){notify=fn;},
    getUser:async()=>({data:{user:sessionId?{id:sessionId}:null}}),
    updateUser(){writes++;return new Promise((resolve,reject)=>{complete={resolve,reject};});}
  }}));
  await new Promise(setImmediate);
  const input=get('sch-new-password-value'), save=get('sch-save-password');
  const submit=()=>get('sch-new-password-form').handlers.submit({preventDefault(){}});
  function recover(id){sessionId=id;notify('PASSWORD_RECOVERY',{user:{id}});input.value='fixture password';}
  await submit();assert.equal(writes,0);
  recover('first');sessionId='second';
  await submit();assert.equal(writes,0);assert.equal(input.value,'');
  recover('first');
  const interrupted=submit();await submit();await new Promise(setImmediate);
  assert.equal(writes,1);complete.reject(Error('offline'));await interrupted;
  assert.equal(save.disabled,false);assert.match(get('sch-new-password-status').textContent,/تعذر تأكيد/);
  const late=submit();await new Promise(setImmediate);
  notify('SIGNED_IN',{user:{id:'second'}});
  complete.resolve({error:null});await late;
  assert.equal(input.value,'');assert.equal(get('sch-new-password-panel').hidden,true);
  recover('first');const success=submit();await new Promise(setImmediate);
  sessionId=null;complete.resolve({error:null});await success;
  assert.equal(input.value,'');assert.equal(get('sch-new-password-panel').hidden,true);
  recover('first');notify('SIGNED_OUT');await submit();assert.equal(writes,3);
});

test('staff sign-in unlocks after an interruption and verifies the publisher before opening the dashboard',async()=>{
  let user=null, roleReads=0;
  const requests=[];
  const get=manager(()=>({
    auth:{
      getUser:async()=>({data:{user}}),
      onAuthStateChange(){},
      signInWithPassword:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))
    },
    from(table){return {
      select(){return this;},eq(){return this;},order(){return this;},limit:async()=>({data:[]}),
      async maybeSingle(){assert.equal(table,'nabd_scholarship_publishers');roleReads++;return {data:{active:true}};}
    };}
  }));
  await new Promise(setImmediate);
  const password=get('sch-password'),button=get('sch-login-button'),message=get('sch-auth-status');
  get('sch-email').value='staff@example.invalid';
  const submit=()=>get('sch-login-form').handlers.submit({preventDefault(){}});
  for(const failure of ['offline','unavailable','denied']){
    password.value='fixture';
    const pending=submit();
    assert.equal(password.value,'');
    password.value='next attempt';
    await submit();
    assert.equal(requests.length,1);
    const request=requests.shift();
    if(failure==='offline')request.reject(Error('offline'));
    else request.resolve({error:{status:failure==='denied'?400:503}});
    await pending;
    assert.equal(button.disabled,false);
    assert.equal(password.value,'next attempt');
    assert.match(message.textContent,failure==='denied'?/sign-in details/:/connection/);
    assert.equal(get('sch-dashboard').hidden,true);
    assert.equal(roleReads,0);
  }
  const pending=submit();
  user={id:'publisher'};requests.shift().resolve({error:null});
  await pending;
  assert.equal(roleReads,1);
  assert.equal(get('sch-dashboard').hidden,false);
  assert.equal(button.disabled,false);
});

for(const signal of [false,true])test('logout confirmation via '+(signal?'auth event':'successful response'),async()=>{
  const pending=[];
  let notify;
  const get=manager(()=>({auth:{
    getUser:async()=>({data:{user:{id:'staff',email:'fixture@example.invalid'}}}),
    onAuthStateChange(fn){notify=fn;},signOut:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))
  },from(){return {select(){return this;},eq(){return this;},order(){return this;},
    maybeSingle:async()=>({data:{active:true}}),limit:async()=>({data:[]})};}}));
  await new Promise(setImmediate);
  const logout=get('sch-logout'),retry=get('sch-retry-logout'),form=get('sch-login-form');
  assert.equal(get('sch-dashboard').hidden,false);
  const first=logout.handlers.click();
  await logout.handlers.click();
  assert.equal(pending.length,1);
  assert.equal(get('sch-dashboard').hidden,true);
  assert.equal(form.hidden,true);
  pending.shift().resolve({error:Error('unconfirmed')});await first;
  assert.equal(retry.hidden,false);
  assert.match(get('sch-auth-status').textContent,/تعذر تأكيد/);
  const second=retry.handlers.click();pending.shift().reject(Error('offline'));await second;
  assert.equal(form.hidden,true);
  const third=retry.handlers.click();
  if(signal){notify('SIGNED_OUT');pending.shift().reject(Error('late response'));}
  else pending.shift().resolve({error:null});
  await third;
  assert.equal(form.hidden,false);
  assert.equal(retry.hidden,true);
  assert.equal(get('sch-current-email').textContent,'');
  assert.match(get('sch-auth-status').textContent,/Signed out/);
});
