import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewSuggestions } from '../src/data/build-review-suggestions.ts';
import { services, experienceTags } from '../src/data/review-options.ts';

test('every service receives three distinct suggestions without assumed sentiment', () => {
  for (const service of services) {
    const reviews = buildReviewSuggestions({ service, highlights: [] });
    assert.equal(reviews.length, 3);
    assert.equal(new Set(reviews.map(review => review.id)).size, 3);
    assert.equal(new Set(reviews.map(review => review.text)).size, 3);
    for (const review of reviews) {
      assert.ok(review.text.includes('Hair Driver'));
      assert.ok(review.text.length < 4000);
      assert.doesNotMatch(review.text, /undefined|excellent|amazing|perfect|best|5-star|friendly|\bclean\b|happy|comfortable|\bsmooth\b|professional/i);
    }
  }
});

test('selected details become natural language without inventing unselected praise', () => {
  const context = { service: 'Hair Styling', highlights: ['Friendly staff', 'Great results'] };
  for (const review of buildReviewSuggestions(context)) {
    assert.match(review.text, /hair styling/);
    assert.match(review.text, /team was really friendly/);
    assert.match(review.text, /happy with the result/);
    assert.doesNotMatch(review.text, /clean|listened|professional|excellent|amazing|perfect|best|5-star/i);
  }
  assert.deepEqual(context.highlights, ['Friendly staff', 'Great results']);
});

test('each highlight contributes only its own observation', () => {
  const expected = ['friendly', 'happy with the result', 'professional', 'clean', 'comfortable', 'little details', 'efficient', 'listened'];
  experienceTags.forEach((highlight, index) => {
    for (const review of buildReviewSuggestions({ service: 'Haircut', highlights: [highlight] })) {
      assert.ok(review.text.includes(expected[index]));
      expected.forEach((phrase, other) => {
        if (other !== index) assert.ok(!review.text.includes(phrase));
      });
    }
  });
});

test('unknown and duplicate highlights are ignored; detail includes all chosen observations', () => {
  const base = { service: 'Facial', highlights: [] };
  assert.deepEqual(buildReviewSuggestions(base), buildReviewSuggestions({ ...base, highlights: ['unknown', 'toString'] }));
  const selected = { ...base, highlights: ['Clean salon', 'Quick service', 'Good communication'] };
  assert.deepEqual(buildReviewSuggestions(selected), buildReviewSuggestions({ ...selected, highlights: [...selected.highlights, 'Clean salon'] }));
  const detailed = buildReviewSuggestions({ ...base, highlights: [...experienceTags] })[2].text;
  for (const phrase of ['friendly', 'happy with the result', 'professional', 'clean', 'comfortable', 'little details', 'efficient', 'listened']) {
    assert.ok(detailed.includes(phrase));
  }
  assert.ok(detailed.length < 4000);
});
