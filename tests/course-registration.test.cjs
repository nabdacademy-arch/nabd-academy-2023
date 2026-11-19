const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const html = readFileSync(require.resolve('../enroll.html'), 'utf8');
const source = readFileSync(require.resolve('../' + html.match(/src="([^"]*\/enroll.js)"/)[1]), 'utf8');
const course = {slug:'sample', title_en:'Sample', hours:4, status:'active'};

function page({insert, catalog, fetch, missing} = {}) {
  const button = {disabled: /<button[^>]*type="submit"[^>]*disabled/.test(html)};
  const form = {resets:0, reset() {this.resets++;}, querySelector: () => button};
  const select = {options:[], add(option) {this.options.push(option);}};
  const message = {classList:{toggle() {}}};
  const nodes = {enrollForm:form, enrollMessage:message, courseSelect:select};
  const client = {from(table) {
    if (table === 'courses') return {select: () => ({eq: () => ({order: catalog || (async () => ({data:[course]}))})})};
    assert.equal(table, 'course_applications');
    return {insert};
  }};
  const ready = vm.runInNewContext(source, {
    window:{nabdSupabase:missing ? null : client}, document:{getElementById:id => nodes[id]},
    location:{search:'?course=sample'}, URLSearchParams, fetch,
    Option:class {constructor(text,value) {Object.assign(this,{text,value});}},
    FormData:class {get(key) {return {full_name:' Example ',email:' student@example.invalid ',phone:'000',course:'sample'}[key];}}
  });
  return {ready, button, form, select, message, submit:() => form.onsubmit({preventDefault() {}})};
}

test('one pending submission, one confirmed reset', async () => {
  let calls = 0, finish;
  const p = page({insert(payload) {
    calls++;
    assert.equal(payload.full_name, 'Example');
    assert.equal(payload.course_slug, 'sample');
    return new Promise(resolve => { finish = resolve; });
  }});
  assert.ok(p.button.disabled);
  await p.ready;
  assert.equal(p.select.value, 'sample');
  const pending = p.submit();
  await p.submit();
  assert.equal(calls, 1);
  finish({});
  await pending;
  assert.equal(p.form.resets, 1);
  assert.match(p.message.textContent, /received successfully/);
});

test('service refusal and lost response preserve entries and allow manual retry', async () => {
  let attempts = 0;
  const p = page({async insert() {
    if (++attempts === 1) return {error:{message:'Unavailable'}};
    if (attempts === 2) throw new Error('Offline');
    return {};
  }});
  await p.ready;
  for (const expected of [/Unavailable/, /Could not confirm/]) {
    await p.submit();
    assert.equal(p.button.disabled, false);
    assert.equal(p.form.resets, 0);
    assert.match(p.message.textContent, expected);
  }
  await p.submit();
  assert.equal(p.form.resets, 1);
});

test('catalog fallback, unavailable catalogs and missing backend', async () => {
  const catalog = async () => {throw new Error('Offline');};
  const fetch = async () => ({ok:true, json:async () => [course, {...course, status:'closed'}]});
  const recovered = page({catalog,fetch});
  await recovered.ready;
  assert.equal(recovered.select.options.length, 2);
  assert.equal(recovered.button.disabled, false);
  const unavailable = page({catalog,fetch:async () => ({ok:false})});
  await unavailable.ready;
  assert.ok(unavailable.button.disabled);
  assert.match(unavailable.message.textContent, /Could not load/);
  const missing = page({missing:true,fetch});
  await missing.ready;
  assert.ok(missing.button.disabled);
  assert.match(missing.message.textContent, /Registration is unavailable/);
});
