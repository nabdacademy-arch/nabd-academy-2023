const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {test} = require("node:test");

function mount(language) {
  const elements = new Map();
  function element() {
    return {value:"", hidden:false, addEventListener(event, listener){ this[event]=listener; },
      append(){}, replaceChildren(){}};
  }
  function get(id) {
    if (!elements.has(id)) elements.set(id,element());
    return elements.get(id);
  }
  const db = {auth:{getUser:async()=>({data:{user:null}})}};
  vm.runInNewContext(fs.readFileSync(require.resolve("../assets/js/nabd-moodle.js"),"utf8"), {
    document:{getElementById:get, documentElement:{}, querySelector:()=>true, querySelectorAll:()=>[], addEventListener(){}, createElement:element},
    window:{nabdSupabase:db}, localStorage:{getItem:()=>language,setItem(){}}, setInterval(){}
  });
  function submit() {
    get("mdl-email").value="student@example.test";
    get("mdl-password").value="fixture";
    return get("mdl-login-form").submit({preventDefault(){}});
  }
  return {get,db,submit};
}

for (const language of ["ar","en"]) {
  test(language+" login recovers from failures and admits a verified student",async()=>{
    const {get,db,submit}=mount(language);
    await new Promise(resolve=>setImmediate(resolve));
    let attempts=0, fail;
    db.auth.signInWithPassword=()=>{attempts++;return new Promise((_,reject)=>{fail=reject;});};
    const first=submit();
    await submit();
    assert.equal(attempts,1);
    fail(Error("offline"));
    await first;
    assert.match(get("mdl-login-message").textContent,language==="ar"?/الاتصال/:/connection/);
    assert.equal(get("mdl-app").hidden,true);
    assert.equal(get("mdl-password").value,"");
    assert.equal(get("mdl-sign-in").disabled,false);
    for (const [error,expected] of [
      [{name:"AuthRetryableFetchError",status:503},language==="ar"?/خدمة الحسابات/:/account service/],
      [{status:400},language==="ar"?/كلمة المرور/:/password/]
    ]) {
      db.auth.signInWithPassword=async()=>({error});
      await submit();
      assert.match(get("mdl-login-message").textContent,expected);
    }
    db.auth.signInWithPassword=async()=>({error:null});
    db.auth.getUser=async()=>({data:{user:{id:"fixture",email:"student@example.test"}}});
    let role="lecturer";
    db.from=()=>({select(){return this;},eq(){return this;},order(){return this;},
      limit:async()=>({data:[]}),maybeSingle:async()=>({data:{role,full_name:"Test Student"}})});
    db.rpc=async()=>({data:[]});
    await submit();
    assert.equal(get("mdl-denied").hidden,false);
    assert.equal(get("mdl-app").hidden,true);
    role="student";
    await submit();
    assert.equal(get("mdl-app").hidden,false);
    assert.equal(get("mdl-student-name").textContent,"Test Student");
    assert.equal(get("mdl-sign-in").disabled,false);
  });
}
