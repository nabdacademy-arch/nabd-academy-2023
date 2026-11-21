const {test}=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");

test("archive and republish require a confirmed change by the current publisher",async()=>{
  function element(){
    return {children:[],classList:{add(){},remove(){}},addEventListener(name,cb){this[name]=cb;},
      replaceChildren(){this.children=[];},append(...children){this.children.push(...children);}};
  }
  const nodes=new Map();
  function get(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);}
  const row={id:"post",published_by:"owner",status:"published",title:"Fixture"};
  let errorMode=false, writes=0;
  const db={auth:{getUser:async()=>({data:{user:{id:"owner"}}}),onAuthStateChange(){}},
    from(table){
      const filters={};
      let values;
      return {select(){return this;},eq(key,value){filters[key]=value;return this;},
        order(){return this;},limit:async()=>({data:[{...row}]}),
        update(payload){values=payload;writes++;return this;},async maybeSingle(){
          if(table==="nabd_scholarship_publishers")return {data:{active:true}};
          assert.equal(filters.id,row.id);
          assert.equal(filters.published_by,row.published_by);
          assert.ok(filters.status);
          if(errorMode)throw Error("offline");
          if(row.status!==filters.status)return {data:null};
          Object.assign(row,values);
          return {data:{id:row.id,status:row.status}};
        }};
    }};
  vm.runInNewContext(fs.readFileSync(require.resolve("../assets/js/scholarship-center.js"),"utf8"),{
    window:{nabdSupabase:db},document:{querySelector:key=>key==="[data-scholarship-manager]",getElementById:get,createElement:element}
  });
  await new Promise(resolve=>setImmediate(resolve));
  const action=()=>get("sch-managed-posts").children[0].children[1].children[1];
  const message=()=>get("sch-publish-status").textContent;
  const first=action();
  await Promise.all([first.click(),first.click()]);
  assert.equal(writes,1);
  assert.equal(row.status,"archived");
  assert.match(message(),/تمت أرشفة/);
  await action().click();
  assert.equal(row.status,"published");
  assert.match(message(),/أعيد نشر/);
  row.status="archived";
  await action().click();
  assert.match(message(),/تغيّرت حالة/);
  assert.equal(action().textContent,"إعادة نشر");
  errorMode=true;
  await action().click();
  assert.match(message(),/تعذر تأكيد/);
  assert.equal(action().disabled,false);
  errorMode=false;
  await action().click();
  assert.equal(row.status,"published");
});
