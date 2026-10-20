import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
  clear() { store.clear(); }
};

const api = await import('../../frontend/src/api.js');
const originalFetch = globalThis.fetch;
const jsonResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return data; }
});
const cloudCall = (id = 'cloud-call-1') => ({
  id,
  prospect_name: 'Demo Prospect',
  company: 'Northstar Labs',
  prospect_role: 'Operations Director',
  status: 'active',
  current_stage_key: 'opening',
  outcome: null,
  summary: null,
  started_at: '2026-10-20T08:00:00.000Z',
  ended_at: null,
  call_stage_results: []
});

function reset() {
  store.clear();
  globalThis.fetch = originalFetch;
}

test('starts a call in cloud mode when the API succeeds', async () => {
  reset();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'POST');
    return jsonResponse({ call: cloudCall() }, 201);
  };
  const result = await api.startCall({ prospectName: 'Demo Prospect', company: 'Northstar Labs', prospectRole: 'Operations Director' });
  assert.equal(result.persistence, 'cloud');
  assert.equal(result.call.id, 'cloud-call-1');
  assert.equal(result.call.stageKey, 'opening');
});

test('starts a local demo call if the API is unavailable', async () => {
  reset();
  globalThis.fetch = async () => { throw new Error('offline'); };
  const result = await api.startCall({ prospectName: 'Local Prospect', company: 'Demo Co', prospectRole: '' });
  assert.equal(result.persistence, 'local');
  assert.match(result.call.id, /^local-/);
  assert.equal(JSON.parse(store.get('call-companion-local-calls-v1')).length, 1);
});

test('saves a stage to cloud and updates the in-memory call', async () => {
  reset();
  let seenUrl = '';
  globalThis.fetch = async (url, options) => {
    seenUrl = String(url);
    assert.equal(options.method, 'POST');
    return jsonResponse({ stageResult: { id: 'stage-1' } }, 201);
  };
  const result = await api.saveStage({ id: 'cloud-call-1', stages: [] }, {
    stageKey: 'purpose', resultKey: 'asked_reason', prospectWords: 'What is this call about?', callerNotes: ''
  });
  assert.match(seenUrl, /\/api\/calls\/cloud-call-1\/stages$/);
  assert.equal(result.persistence, 'cloud');
  assert.equal(result.call.stageKey, 'purpose');
  assert.equal(result.call.stages[0].stageName, 'Purpose');
  assert.equal(store.has('call-companion-local-calls-v1'), false);
});

test('does not silently downgrade a failed cloud stage save to local storage', async () => {
  reset();
  globalThis.fetch = async () => jsonResponse({ error: 'temporary outage' }, 503);
  await assert.rejects(
    api.saveStage({ id: 'cloud-call-1', stages: [] }, { stageKey: 'purpose', resultKey: 'asked_reason', prospectWords: 'What is this about?' }),
    /temporary outage/
  );
  assert.equal(store.has('call-companion-local-calls-v1'), false);
});

test('lists both cloud calls and browser-local demo calls when the API is available', async () => {
  reset();
  const localCall = {
    id: 'local-demo-1', prospectName: 'Offline Prospect', company: 'Demo Co', prospectRole: '',
    status: 'completed', stageKey: 'opening', outcome: 'Not interested', summary: '',
    startedAt: '2026-10-20T09:00:00.000Z', endedAt: '2026-10-20T09:01:00.000Z', stages: [], persistence: 'local'
  };
  store.set('call-companion-local-calls-v1', JSON.stringify([localCall]));
  globalThis.fetch = async () => jsonResponse({ calls: [cloudCall()] });
  const result = await api.listCalls();
  assert.equal(result.persistence, 'cloud');
  assert.deepEqual(new Set(result.calls.map((call) => call.id)), new Set(['cloud-call-1', 'local-demo-1']));
});

test('does not silently downgrade a failed cloud closeout to local storage', async () => {
  reset();
  globalThis.fetch = async () => jsonResponse({ error: 'temporary outage' }, 503);
  await assert.rejects(
    api.closeCall({ id: 'cloud-call-1', stages: [] }, { outcome: 'Not interested', summary: 'Declined.' }),
    /temporary outage/
  );
  assert.equal(store.has('call-companion-local-calls-v1'), false);
});

test('closes a browser-local call in local storage', async () => {
  reset();
  const call = {
    id: 'local-demo-1', prospectName: 'Offline Prospect', company: 'Demo Co', status: 'active',
    stageKey: 'opening', stages: [], startedAt: '2026-10-20T08:00:00.000Z'
  };
  const result = await api.closeCall(call, { outcome: 'Not interested', summary: 'Prospect declined.' });
  assert.equal(result.persistence, 'local');
  assert.equal(result.call.status, 'completed');
  assert.equal(JSON.parse(store.get('call-companion-local-calls-v1'))[0].outcome, 'Not interested');
});

test.after(() => { globalThis.fetch = originalFetch; });


test('uses transcript-informed local stage hints for representative tricky statements', async (t) => {
  const cases = [
    { name: 'purpose questions', text: 'Why are you calling me? What does your company actually do?', current: 'opening', expected: 'purpose' },
    { name: 'a person busy now', text: 'I am in a meeting, please call me tomorrow.', current: 'opening', expected: 'permission' },
    { name: 'a business description', text: 'We manufacture industrial packaging for food brands.', current: 'permission', expected: 'their_business' },
    { name: 'a stated growth goal', text: 'We want to enter a new market and improve one product line.', current: 'their_business', expected: 'their_need' },
    { name: 'no expressed need', text: 'Our current customers are enough and we do not need anything new.', current: 'their_business', expected: 'their_need' },
    { name: 'no requirement right now', text: 'We do not require this service now; our existing business is enough.', current: 'their_business', expected: 'their_need' },
    { name: 'wrong contact early in the call', text: 'I am not the right person for this topic.', current: 'opening', expected: 'opening' },
    { name: 'an existing provider', text: 'Our group already has an internal team handling this work.', current: 'their_need', expected: 'objection' },
    { name: 'a concrete report handoff', text: 'Please send the overview to my work email and I will read it.', current: 'objection', expected: 'next_step' },
    { name: 'a specific follow-up', text: 'Let us discuss this next Tuesday at 2:30 PM; send a meeting invite.', current: 'their_need', expected: 'next_step' },
    { name: 'a failed connection', text: 'The line is breaking up and I cannot hear you.', current: 'objection', expected: 'close' },
    { name: 'a source-of-number question', text: 'Where did you get my number?', current: 'purpose', expected: 'purpose' }
  ];
  globalThis.fetch = async () => { throw new Error('offline for fallback test'); };
  for (const item of cases) {
    await t.test(item.name, async () => {
      const result = await api.suggestStage(item.text, item.current);
      assert.equal(result.aiMode, 'fallback');
      assert.equal(result.stageKey, item.expected);
    });
  }
});
