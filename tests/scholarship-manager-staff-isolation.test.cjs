"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync(require.resolve("../assets/js/scholarship-center.js"),"utf8");
const html=fs.readFileSync(require.resolve("../scholarship-manager.html"),"utf8");
function stub(){
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,addEventListener(name,fn){this[name]=fn;},classList:{remove(){},add(){}},reset(){}});
  return elements.get(id);
 };
 let fallbackCalled=0;
 vm.runInNewContext(source,{
  document:{querySelector:selector=>selector==="[data-scholarship-manager]"?{}:null,getElementById:get},
  window:{NABD_CONFIG:{supabaseUrl:"https://example.test",supabaseAnonKey:"public"},supabase:{createClient(){throw Error("SDK missing");}},
   nabdSupabase:{auth:{getUser(){fallbackCalled++;throw Error("wrong session");}}}}
 });
 return {get,fallbackCalled};
}
test("staff portal fails closed if its isolated Supabase client cannot initialize",()=>{
 const p=stub();
 assert.equal(p.fallbackCalled,0);
 assert.equal(p.get("sch-login-button").disabled,true);
 assert.equal(p.get("sch-reset-password").disabled,true);
 assert.match(p.get("sch-auth-status").textContent,/تعذّر تهيئة/);
});
test("staff page does not instantiate the student shared session",()=>{
 assert.doesNotMatch(html,/src="assets\/js\/supabase-client\.js/);
 assert.match(source,/nabd-scholarships-manager-auth-v1/);
 assert.match(html,/id="sch-retry-role"/);
 assert.match(html,/id="sch-retry-logout"/);
});
