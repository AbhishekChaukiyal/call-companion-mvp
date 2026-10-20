import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const frontSource = await readFile(new URL('frontend/src/api.js', root), 'utf8');
const backSource = await readFile(new URL('backend/src/stages.js', root), 'utf8');

function extractStages(source, fileName) {
  const match = source.match(/export const STAGES = (\[[\s\S]*?\n\]);/);
  assert.ok(match, `Could not find STAGES array in ${fileName}`);
  return JSON.parse(match[1]);
}

const frontendStages = extractStages(frontSource, 'frontend/src/api.js');
const backendStages = extractStages(backSource, 'backend/src/stages.js');
assert.deepEqual(frontendStages, backendStages, 'Frontend/backend stage guides must match exactly');
assert.equal(frontendStages.length, 8, 'The guide must have exactly eight stages');
assert.deepEqual(frontendStages.map((stage) => stage.number), [1, 2, 3, 4, 5, 6, 7, 8]);

const stageKeys = new Set();
for (const stage of frontendStages) {
  assert.ok(stage.key && stage.name && stage.purpose && stage.prompt, `Missing core copy in ${stage.key}`);
  assert.ok(!stageKeys.has(stage.key), `Duplicate stage key: ${stage.key}`);
  stageKeys.add(stage.key);
  assert.equal(stage.examples.length, 3, `${stage.key} must have three response examples`);
  assert.equal(stage.taps.length, 4, `${stage.key} must have four quick taps`);
  assert.equal(new Set(stage.taps.map((tap) => tap.key)).size, 4, `${stage.key} has duplicate quick-tap keys`);
  for (const tap of stage.taps) assert.ok(tap.key && tap.label, `Invalid tap in ${stage.key}`);
}

console.log('Stage guide validation passed.');
console.log(`Validated ${frontendStages.length} stages, ${frontendStages.reduce((sum, stage) => sum + stage.examples.length, 0)} response examples, and ${frontendStages.reduce((sum, stage) => sum + stage.taps.length, 0)} stage quick-tap options.`);
