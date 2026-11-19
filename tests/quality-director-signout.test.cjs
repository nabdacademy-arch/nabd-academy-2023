const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const tick = () => new Promise(resolve => setImmediate(resolve));

async function openDirector() {
  const nodes = new Map();
  function node() {
    return { value: '', replaceChildren() {}, append() {},
      addEventListener(event, handler) { this[event] = handler; } };
  }
  function byId(id) {
    if (!nodes.has(id)) nodes.set(id, node());
    return nodes.get(id);
  }
  let reloads = 0;
  const requests = [];
  const client = {
    auth: {
      getUser: async () => ({data:{user:{id:'owner'}}}),
      signOut: () => new Promise((resolve,reject) => requests.push({resolve,reject}))
    },
    rpc: async () => ({data:{enabled:false}}),
    from: () => ({
      select(){return this;}, eq(){return this;}, order(){return this;},
      maybeSingle: async () => ({data:{user_id:'owner'}}), limit: async () => ({data:[]})
    })
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/quality-director.js'),'utf8'), {
    window:{nabdSupabase:client, location:{reload(){reloads++;}}},
    document:{querySelector:()=>true,getElementById:byId,createElement:node,addEventListener(){}},
    Option:function(){}, setInterval(){}
  });
  await tick();
  assert.equal(byId('ql-workspace').hidden,false);
  return {byId,requests,reloads:()=>reloads};
}
test('confirmed sign-out hides workspace immediately and reloads once', async () => {
  const {byId,requests,reloads} = await openDirector();
  const pending = byId('ql-logout').click();
  await byId('ql-logout').click();
  assert.equal(requests.length,1);
  assert.equal(byId('ql-workspace').hidden,true);
  assert.equal(reloads(),0);
  requests[0].resolve({error:null});
  await pending;
  assert.equal(reloads(),1);
});

for (const failure of ['returned error','rejected promise']) {
  test(failure+' keeps the panel locked and permits a confirmed retry', async () => {
    const {byId,requests,reloads} = await openDirector();
    const pending = byId('ql-logout').click();
    if(failure==='returned error') requests[0].resolve({error:Error('offline')});
    else requests[0].reject(Error('offline'));
    await pending;
    assert.equal(reloads(),0);
    assert.equal(byId('ql-workspace').hidden,true);
    assert.equal(byId('ql-login-form').hidden,true);
    assert.match(byId('ql-login-status').textContent,/تعذّر تأكيد/);
    assert.equal(byId('ql-logout-retry').hidden,false);
    const retry = byId('ql-logout-retry').click();
    requests[1].resolve({error:null});
    await retry;
    assert.equal(reloads(),1);
  });
}
