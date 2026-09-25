import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSuggestions } from '../src/components/review/types.ts';

const valid = [
  { id: 'short', title: 'Short', text: 'My experience.' },
  { id: 'warm', title: 'Warm', text: 'My experience in more words.' },
  { id: 'detailed', title: 'Detailed', text: 'More detail about my visit.' },
];

test('accepts exactly three uniquely identified API suggestions', () => {
  assert.deepEqual(validateSuggestions(valid), valid);
});

test('rejects incomplete or malformed responses rather than presenting them as reviews', () => {
  for (const result of [null, {}, [], valid.slice(0, 2), [...valid, valid[0]], [null, ...valid.slice(1)], [{ id: 'a', title: ' ', text: 'Text' }, ...valid.slice(1)]]) {
    assert.throws(() => validateSuggestions(result));
  }
});

test('rejects duplicate identifiers that would corrupt single-selection and draft state', () => {
  assert.throws(() => validateSuggestions([valid[0], valid[0], valid[2]]));
});
