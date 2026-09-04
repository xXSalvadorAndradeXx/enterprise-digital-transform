const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const jwt = (seconds) => `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + seconds })).toString('base64url')}.signature`;
function setup(initial, fetch) {
  const jar = new Map(Object.entries(initial));
  const store = { get: (key) => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value) => jar.set(key, value), delete: (key) => jar.delete(key) };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/lib/session.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: () => ({ cookies: async () => store }), Buffer, Date, Map, JSON, fetch, AbortController, setTimeout, clearTimeout, process: { env: { BACKEND_API_URL: 'http://backend.test' } } });
  return { session: exports, jar };
}

test('valid access token does not refresh', async () => {
  const token = jwt(600);
  const { session } = setup({ erp_session: token }, () => assert.fail('unexpected fetch'));
  assert.equal(await session.getAuthToken(), token);
});
for (const expired of [false, true]) {
  test(expired ? 'expired JWT refreshes' : 'missing access cookie refreshes', async () => {
    const token = jwt(900);
    const { session, jar } = setup({ erp_refresh_session: 'old-refresh', ...(expired ? { erp_session: jwt(-1) } : {}) }, async () => Response.json({ accessToken: token, refreshToken: 'new-refresh' }));
    assert.equal(await session.getAuthToken(), token);
    assert.equal(jar.get('erp_refresh_session'), 'new-refresh');
  });
}
test('concurrent requests share one rotation', async () => {
  let calls = 0;
  const token = jwt(900);
  const { session } = setup({ erp_refresh_session: 'old-refresh' }, async () => { calls++; return Response.json({ access_token: token, refresh_token: 'new-refresh' }); });
  const result = await Promise.all([session.getAuthToken(), session.getAuthToken()]);
  assert.deepEqual(result, [token, token]);
  assert.equal(calls, 1);
});
test('rejected refresh clears session', async () => {
  const { session, jar } = setup({ erp_refresh_session: 'invalid' }, async () => new Response(null, { status: 401 }));
  assert.equal(await session.getAuthToken(), null);
  assert.equal(jar.has('erp_refresh_session'), false);
});
test('temporary backend failure preserves refresh cookie', async () => {
  const { session, jar } = setup({ erp_refresh_session: 'valid' }, async () => new Response(null, { status: 503 }));
  await assert.rejects(session.getAuthToken(), /renovar/);
  assert.equal(jar.get('erp_refresh_session'), 'valid');
});
test('server component read does not rotate cookies', async () => {
  const { session } = setup({ erp_refresh_session: 'valid' }, () => assert.fail('unexpected fetch'));
  assert.equal(await session.getAuthSession(), null);
});
