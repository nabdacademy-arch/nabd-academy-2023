"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync(require.resolve("../assets/js/scholarship-center.js"),"utf8");
function fixture(){
 const storage=new Map(),ui={text:""};
 const values=[{value:"Scholarship",maxLength:180},{value:"Details of offer",maxLength:12000},{value:"https://example.org",maxLength:1500}];
 const state={draft:null,savedDraft:null,submitting:false,signedInUser:{id:"publisher-a"},
   editorFields:values,editId:{value:""},discardDraft:{hidden:true},draftStatus:{},
   setStatus:(node,message)=>{ui.text=message},
   localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),
    removeItem:key=>storage.delete(key)}};
 const start=source.indexOf("  const draftKey="),end=source.indexOf("  let verification=",start);
 assert.ok(start>0&&end>start);
 vm.createContext(state);
 vm.runInContext(source.slice(start,end),state);
 return {state,storage,values,ui};
}
test("draft survives page reload and belongs only to its publisher",()=>{
 const {state,storage,values}=fixture();
 state.saveDraft();
 assert.equal(storage.size,1);
 const key="nabd-scholarship-manager-draft-v1:publisher-a";
 assert.equal(JSON.parse(storage.get(key))[0],"Scholarship");
 values.forEach(field=>field.value="");
 state.loadDraft("publisher-b");
 assert.equal(state.draft,null);
 state.loadDraft("publisher-a");
 assert.equal(state.draft[0],"Scholarship");
 assert.equal(state.savedDraft,storage.get(key));
});
test("updates in an existing published item never overwrite a new draft",()=>{
 const {state,storage,values}=fixture();
 state.saveDraft();
 state.editId.value="published-123";
 values[0].value="Edit an existing scholarship";
 state.saveDraft();
 assert.equal(JSON.parse([...storage.values()][0])[0],"Scholarship");
});
test("draft is removed only if the exact saved version is unchanged",()=>{
 const {state,storage}=fixture();
 state.saveDraft();
 const old=state.savedDraft;
 const key="nabd-scholarship-manager-draft-v1:publisher-a";
 storage.set(key,JSON.stringify(["newer", "details", "https://example.org"]));
 assert.equal(state.clearDraft("publisher-a",old),false);
 assert.equal(storage.has(key),true);
 assert.equal(state.clearDraft("publisher-a",storage.get(key)),true);
 assert.equal(storage.has(key),false);
});
