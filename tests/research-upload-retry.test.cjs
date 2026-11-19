const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const source = readFileSync(require.resolve('../assets/js/research-pdf-uploader.js'), 'utf8');
const small = new Blob(['%PDF-test']);
const large = new Blob([small, new Uint8Array(6 * 1024 * 1024)]);

function fixture(withTus = true) {
  const paths = [];
  let owner = 'researcher-a';
  let offline = true;
  class Upload {
    constructor(body, options) { this.options = options; }
    async findPreviousUploads() { return []; }
    start() {
      paths.push(this.options.metadata.objectName);
      if (offline) this.options.onError(Error('network'));
      else this.options.onSuccess();
    }
  }
  const window = { NABD_CONFIG: { supabaseUrl: 'https://example.supabase.co' } };
  if (withTus) window.tus = { Upload };
  let sequence = 0;
  runInNewContext(source, {
    window, document: { getElementById: () => null }, URL,
    crypto: { randomUUID: () => String(++sequence) }
  });
  const client = {
    auth: { getSession: async () => ({ data: { session: { access_token: 'mock' } } }) },
    storage: { from: () => ({ async upload(path, body, options) {
      assert.equal(options.upsert, false);
      paths.push(path);
      return { error: offline ? Error('network') : null };
    } }) }
  };
  const adapter = window.NABDResearchPDFUploader.create({ client, bucket: 'research', userId: () => owner });
  return { paths, upload: adapter.uploadPdf, reconnect() { offline = false; }, switchOwner() { owner = 'researcher-b'; } };
}

for (const [label, file, withTus] of [
  ['small PDF with TUS available', small, true],
  ['large PDF with native fallback', large, false]
]) {
  test(label + ' retries native upload at a fresh path', async () => {
    const f = fixture(withTus);
    await assert.rejects(f.upload(file), /الاتصال انقطع/);
    f.reconnect();
    assert.equal(await f.upload(file), f.paths[1]);
    assert.notEqual(f.paths[0], f.paths[1]);
  });
}

test('a resumable retry retains its path until success', async () => {
  const f = fixture();
  await assert.rejects(f.upload(large), /الاتصال انقطع/);
  f.reconnect();
  assert.equal(await f.upload(large), f.paths[0]);
  assert.notEqual(await f.upload(large), f.paths[0]);
});

test('another researcher gets an independent resumable path', async () => {
  const f = fixture();
  await assert.rejects(f.upload(large), /الاتصال انقطع/);
  f.switchOwner();
  f.reconnect();
  assert.match(await f.upload(large), /^researcher-b\//);
});
