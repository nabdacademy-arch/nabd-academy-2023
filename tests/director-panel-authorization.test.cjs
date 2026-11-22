const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/nabd-360-admin.js'), 'utf8');

function element(){
  return {children:[],dataset:{},classList:{add(){},toggle(){}},handlers:{},
    append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
    setAttribute(){},addEventListener(name,fn){this.handlers[name]=fn},
    querySelector(id){return all(this).find(n=>'#'+n.id===id)},querySelectorAll(){return []}};
}
function all(node){return [node,...node.children.flatMap(all)]}
function harness(){
  let module;
  vm.runInNewContext(source,{document:{createElement:element},window:{NABD_ADMIN_REGISTER_MODULE:m=>module=m}});
  return module;
}
function db(id,role){
  let reads=0;
  return {auth:{getUser:async()=>({data:{user:{id}}})},get reads(){return reads},
    from(table){return {select(col,opts){
      if(table==='profiles')return {eq:()=>({maybeSingle:()=>role})};
      reads++;
      if(opts?.head)return Promise.resolve({count:1});
      return {order:()=>({limit:async()=>({data:[{full_name:'Private applicant',status:'pending'}]})})};
    }}}
  };
}
test('director can view applications; next account sees no prior data during checks or denial',async()=>{
  const module=harness(),panel=element();
  const director=db('director',{data:{role:'admin'}});
  await module.render(panel,{user:{id:'director'},db:director});
  all(panel).find(n=>n.dataset.page==='faculty').handlers.click();
  assert.ok(all(panel).some(n=>n.textContent==='Private applicant'));
  let finish;
  const other=db('other',new Promise(resolve=>{finish=resolve}));
  const checking=module.render(panel,{user:{id:'other'},db:other});
  assert.equal(all(panel).length,2);
  assert.equal(other.reads,0);
  finish({data:{role:'student'}});
  await checking;
  assert.match(panel.children[0].textContent,/رفض الوصول/);
  assert.equal(other.reads,0);
});
test('superseded role responses cannot open or replace a newer panel',async()=>{
  for(const failure of [false,true]){
    const module=harness(),panel=element();
    let finish,fail;
    const old=db('old',new Promise((resolve,reject)=>{finish=resolve;fail=reject}));
    const pending=module.render(panel,{user:{id:'old'},db:old});
    await module.render(panel,{user:null,db:null});
    if(failure)fail(new Error('offline'));else finish({data:{role:'admin'}});
    await pending;
    assert.equal(old.reads,0);
    assert.match(panel.children[0].textContent,/الدخول الإداري مطلوب/);
  }
});
