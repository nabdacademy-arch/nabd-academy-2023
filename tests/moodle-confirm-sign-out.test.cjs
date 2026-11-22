const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

for (const role of ["student","lecturer"]) {
  test(role+" sign-out waits for confirmation and supports retry", async()=>{
    const elements=new Map();
    function element(){
      return {hidden:true, disabled:false, value:"", append(){}, replaceChildren(){},
        addEventListener(name,fn){this[name]=fn;}};
    }
    function get(id){
      if(!elements.has(id))elements.set(id,element());
      return elements.get(id);
    }
    let user={id:"old",email:"old@example.test"}, finishHistory;
    const requests=[];
    const db={
      auth:{getUser:async()=>({data:{user}}),signInWithPassword:async()=>({}),
        signOut:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))},
      from:()=>({select(){return this;},eq(){return this;},order(){return this;},
        limit:async()=>({data:[]}),maybeSingle:async()=>({data:{full_name:user.id,role:user.id==="old"?role:"student"}})}),
      rpc:async name=>name==="nabd_quality_student_history" && user.id==="old"
        ?new Promise(resolve=>{finishHistory=resolve;}) : {data:[]}
    };
    vm.runInNewContext(fs.readFileSync(require.resolve("../assets/js/nabd-moodle.js"),"utf8"),{
      document:{getElementById:get,querySelector:()=>true,querySelectorAll:()=>[],documentElement:{},createElement:element,addEventListener(){}},
      window:{nabdSupabase:db,addEventListener(){}},localStorage:{getItem:()=>"en",setItem(){}},setInterval(){}
    });
    await new Promise(resolve=>setImmediate(resolve));
    const trigger=get(role==="student"?"mdl-sign-out":"mdl-change-account");
    assert.equal(get(role==="student"?"mdl-app":"mdl-denied").hidden,false);
    let waiting=trigger.click();
    await trigger.click();
    assert.equal(requests.length,1);
    assert.equal(get("mdl-login").hidden,true);
    assert.equal(get("mdl-app").hidden,true);
    assert.equal(get("mdl-exit").hidden,false);
    requests.shift().resolve({error:Error("service unavailable")});
    await waiting;
    const retry=get("mdl-retry-sign-out");
    assert.equal(retry.hidden,false);
    assert.match(get("mdl-exit-message").textContent,/could not be confirmed/);
    waiting=retry.click();
    requests.shift().reject(Error("offline"));
    await waiting;
    assert.equal(get("mdl-login").hidden,true);
    assert.equal(retry.disabled,false);
    waiting=retry.click();
    requests.shift().resolve({error:null});
    await waiting;
    assert.equal(get("mdl-login").hidden,false);
    assert.equal(get("mdl-exit").hidden,true);
    user={id:"next",email:"new@example.test"};
    get("mdl-email").value=user.email;get("mdl-password").value="fixture";
    await get("mdl-login-form").submit({preventDefault(){}});
    if(finishHistory)finishHistory({data:[{human_score:99}]});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(get("mdl-student-name").textContent,"next");
    assert.equal(get("mdl-graded-count").textContent,"0");
  });
}
