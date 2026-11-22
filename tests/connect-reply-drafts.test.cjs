const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/nabd-connect.js'),'utf8');
const flush=()=>new Promise(setImmediate);

async function inbox(){
  const nodes=new Map(), writes=[];
  function element(){
    return {children:[],handlers:{},value:'',dataset:{},classList:{toggle(){}},
      append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
      addEventListener(name,fn){this.handlers[name]=fn},setAttribute(){}};
  }
  function get(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)}
  const db={auth:{getUser:async()=>({data:{user:{id:'student'}}})},from(table){
    const rows=table==='nabd_support_tickets'?['a','b'].map(id=>({id,subject:id,status:'open'})):[];
    const q={select:()=>q,eq:()=>q,order:()=>q,limit:async()=>({data:rows}),
      insert:payload=>new Promise((resolve,reject)=>writes.push({payload,resolve,reject}))};
    return q;
  }};
  vm.runInNewContext(source,{document:{body:{dataset:{onePage:'connect'}},documentElement:{},
    createElement:element,getElementById:get,querySelectorAll:()=>[]},
    window:{NABD_CONFIG:{supabaseUrl:'local',supabaseAnonKey:'test'},supabase:{createClient:()=>db}}});
  await flush();
  return {get,writes,type(text){get('nc-reply').value=text;get('nc-reply').handlers.input()},
    async open(id){get('nc-list').children.find(n=>n.dataset.id===id).handlers.click();await flush()},
    send(){get('nc-reply-form').handlers.submit({preventDefault(){}})}};
}

test('switching tickets restores only their own unsent text',async()=>{
  const p=await inbox();p.type('First draft');await p.open('b');
  assert.equal(p.get('nc-reply').value,'');
  p.type('Second draft');await p.open('a');
  assert.equal(p.get('nc-reply').value,'First draft');
  p.send();assert.equal(p.writes[0].payload.ticket_id,'a');
  assert.equal(p.writes[0].payload.body,'First draft');
  p.writes[0].resolve({});await flush();
  assert.equal(p.get('nc-reply').value,'');
  await p.open('b');assert.equal(p.get('nc-reply').value,'Second draft');
});

test('late success and failure stay with the ticket being sent',async()=>{
  for(const success of [true,false]){
    const p=await inbox();p.type('Original');p.send();
    await p.open('b');p.type('Unrelated');
    if(success)p.writes[0].resolve({});else p.writes[0].reject(Error('offline'));
    await flush();assert.equal(p.get('nc-thread-title').textContent,'b');
    assert.equal(p.get('nc-reply').value,'Unrelated');
    await p.open('a');assert.equal(p.get('nc-reply').value,success?'':'Original');
  }
});

test('a confirmed send preserves edits made while waiting',async()=>{
  const p=await inbox();p.type('Initial');p.send();p.type('Edited during save');
  p.writes[0].resolve({});await flush();
  assert.equal(p.get('nc-reply').value,'Edited during save');
});
