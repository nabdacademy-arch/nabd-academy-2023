const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../portal/js/app.js'), 'utf8');
const handler = code.slice(code.indexOf("  ROOT.addEventListener('change'"), code.indexOf("  ROOT.addEventListener('submit'"));

function page(server, { offline, refreshFails } = {}) {
  const state = { user: { id: 'staff' }, profile: {}, tasks: [{ id: 'task', status: 'todo', updated_at: 'v1' }] };
  const control = { dataset: { taskId: 'task' }, value: 'done' };
  let change, message;
  const client = { from() { return {
    filters: {}, update(values) { this.values = values; return this; },
    eq(key, value) { this.filters[key] = value; return this; }, select() { return this; },
    async maybeSingle() {
      if (offline) throw Error('offline');
      if (!Object.entries(this.filters).every(([k,v]) => server[k] === v)) return { data: null };
      Object.assign(server, this.values, { updated_at: 'v3' });
      return { data: { ...server } };
    }
  }; } };
  vm.runInNewContext(handler, { ROOT: { addEventListener(_, fn) { change = fn; } },
    state, client, T: key => key, U: (_, en) => en, notify: text => { message = text; },
    refreshData: async () => {
      if (refreshFails) throw Error('offline');
      state.tasks = [{ ...server }];
    }
  });
  return { state, control, async submit() { await change({ target: control }); return message; } };
}
test('two editors can change a task only from the version they saw', async () => {
  const server = { id: 'task', status: 'todo', updated_at: 'v1' };
  const first = page(server), second = page(server);
  assert.equal(await first.submit(), 'actionDone');
  second.control.value = 'in_progress';
  assert.match(await second.submit(), /changed/);
  assert.equal(server.status, 'done');
  assert.equal(second.state.tasks[0].status, 'done');
});
test('connection failure leaves status unconfirmed and unlocks the control', async () => {
  const p = page({}, { offline: true });
  assert.match(await p.submit(), /unconfirmed/);
  assert.equal(p.control.value, 'todo');
  assert.equal(p.control.disabled, false);
});
test('a confirmed write survives a failed list refresh', async () => {
  const p = page({ id: 'task', updated_at: 'v1' }, { refreshFails: true });
  assert.match(await p.submit(), /Status saved/);
  assert.equal(p.state.tasks[0].status, 'done');
  assert.equal(p.state.tasks[0].updated_at, 'v3');
});
