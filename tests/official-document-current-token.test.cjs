const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../assets/js/official-document-verification.js"), "utf8");
const first = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const second = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function page(){
  const nodes = {};
  const requests = [];
  function node(){
    return { value: "", append(){}, replaceChildren(){}, addEventListener(event, fn){ this[event] = fn; } };
  }
  for(const id of ["token","form","check","result","details","title","description"]) nodes[id] = node();
  vm.runInNewContext(source, {
    document: { getElementById: id => nodes[id], createElement: node },
    window: { NABD_CONFIG: { supabaseUrl: "https://example.invalid", supabaseAnonKey: "fixture" } },
    location: { search: "?token=" + first }, URLSearchParams,
    fetch: () => new Promise((resolve, reject) => requests.push({
      reply: status => resolve(new Response(JSON.stringify({status}))), respond: resolve, reject
    }))
  });
  return { nodes, requests };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test("editing a verified QR code clears the previous result", async () => {
  const {nodes, requests} = page();
  requests[0].reply("valid");
  await settle();
  assert.equal(nodes.result.className, "valid");
  nodes.token.value = "";
  nodes.token.input();
  assert.equal(nodes.result.hidden, true);
  await nodes.form.submit();
  assert.equal(nodes.result.className, "invalid");
  assert.equal(requests.length, 1);
});

for (const late of ["reply", "reject"]) {
  test("stale " + late + " cannot replace the newer verdict", async () => {
    const {nodes, requests} = page();
    nodes.token.value = second;
    nodes.token.input();
    const check = nodes.form.submit();
    requests[1].reply("void");
    await check;
    requests[0][late]("valid");
    await settle();
    assert.equal(nodes.result.className, "void");
    assert.equal(nodes.result.hidden, false);
  });
}
test("an older completion cannot enable the button during the next request", async () => {
  const {nodes, requests} = page();
  nodes.token.value = second;
  nodes.token.input();
  const check = nodes.form.submit();
  requests[0].reply("valid");
  await settle();
  assert.equal(nodes.check.disabled, true);
  assert.equal(nodes.result.hidden, true);
  requests[1].reject(new Error("offline"));
  await check;
  assert.equal(nodes.title.textContent, "تعذّر الاتصال");
  assert.equal(nodes.check.disabled, false);
});

for(const [code,body] of [[400,'{"status":"invalid"}'],[503,'{"status":"valid"}'],[200,'null'],[200,'bad JSON'],[200,'{}']]){
  test("unconfirmed response " + code + " " + body + " allows retry", async()=>{
    const {nodes,requests}=page();
    requests[0].respond(new Response(body,{status:code}));
    await settle();
    assert.equal(nodes.result.className,"unavailable");
    assert.equal(nodes.check.disabled,false);
    const retry=nodes.form.submit();
    requests[1].reply("invalid");
    await retry;
    assert.equal(nodes.title.textContent,"لم يُعثر على المستند");
  });
}
