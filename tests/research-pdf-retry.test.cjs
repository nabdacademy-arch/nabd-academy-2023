const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/js/research-center.js'), 'utf8');
const signedUrl = 'https://example.invalid/paper.pdf';
function element() {
  return {children:[],handlers:{},classList:{remove(){},add(){}},setAttribute(){},
    append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},
    addEventListener(type,fn){this.handlers[type]=fn}};
}
async function page(sign, blockPopup=false) {
  const listing=element(), feedback=element(), windows=[], navigations=[];
  let deadline;
  const query={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:[{title:'Example',pdf_path:'sample.pdf'}]})};
  const client={from:()=>query,storage:{from:()=>({createSignedUrl:sign})}};
  const window={nabdSupabase:client,addEventListener(){},location:{assign:url=>navigations.push(url)},
    open(){if(blockPopup)return null;
      const popup={opener:window,closed:false,close(){this.closed=true},location:{replace:url=>navigations.push(url)}};
      windows.push(popup);return popup}};
  vm.runInNewContext(source,{window,document:{createElement:element,querySelector:s=>s==='[data-research-list]'?listing:null,
    getElementById:id=>id==='res-public-status'?feedback:null,addEventListener(){}},setInterval(){},
    setTimeout(fn,ms){assert.equal(ms,20000);deadline=fn;return 1},clearTimeout(){}});
  await new Promise(setImmediate);
  const button=listing.children[0].children.at(-1);
  return {button,feedback,windows,navigations,click:()=>button.handlers.click(),expire:()=>deadline()};
}
test('opens a signed link in an isolated tab or current page when popups are blocked',async()=>{
  for(const blocked of [false,true]){
    const p=await page(async(path,ttl)=>{assert.equal(path,'sample.pdf');assert.equal(ttl,600);return {data:{signedUrl}}},blocked);
    await p.click();
    assert.deepEqual(p.navigations,[signedUrl]);
    if(!blocked)assert.equal(p.windows[0].opener,null);
    assert.equal(p.button.disabled,false);
  }
});
test('failed reads close the empty tab and permit a successful retry',async()=>{
  for(const fail of [()=>Promise.reject(Error('offline')),()=>({error:true}),()=>({data:{}})]){
    let calls=0;
    const p=await page(()=>++calls===1?fail():{data:{signedUrl}});
    await p.click();
    assert.ok(p.windows[0].closed);
    assert.match(p.feedback.textContent,/إعادة المحاولة/);
    await p.click();
    assert.deepEqual(p.navigations,[signedUrl]);
    assert.equal(p.feedback.hidden,true);
  }
});
test('timeout permits retry; late results and duplicate clicks do not navigate again',async()=>{
  let finish,calls=0;
  const p=await page(()=>++calls===1?new Promise(resolve=>{finish=resolve}):{data:{signedUrl}});
  const pending=p.click();await p.click();assert.equal(calls,1);
  p.expire();await pending;
  assert.ok(p.windows[0].closed);
  await p.click();finish({data:{signedUrl:'old'}});await new Promise(setImmediate);
  assert.deepEqual(p.navigations,[signedUrl]);
});
