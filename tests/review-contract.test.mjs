import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewSuggestions } from '../src/data/build-review-suggestions.ts';

test('every rating and service receives three distinct, bounded writing suggestions', () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    for (const service of ['Haircut', 'Hair Styling', 'Other', 'Facial']) {
      const reviews = buildReviewSuggestions({ rating, service, highlights: [] });
      assert.equal(reviews.length, 3);
      assert.equal(new Set(reviews.map(review => review.id)).size, 3);
      assert.equal(new Set(reviews.map(review => review.text)).size, 3);
      for (const review of reviews) {
        assert.ok(review.text.includes('Hair Driver'));
        assert.ok(review.text.length < 4000);
        assert.doesNotMatch(review.text, /undefined|AI|API/);
      }
    }
  }
});

test('selected details become natural language without inventing unselected praise', () => {
  const context = { rating: 4, service: 'Hair Styling', highlights: ['Friendly staff', 'Great results'] };
  const reviews = buildReviewSuggestions(context);
  for (const review of reviews) {
    assert.match(review.text, /hair styling/);
    assert.match(review.text, /team was really friendly/);
    assert.match(review.text, /happy with the result/);
    assert.doesNotMatch(review.text, /clean|listened|professional/);
  }
  assert.deepEqual(context.highlights, ['Friendly staff', 'Great results']);
});

test('lower ratings retain their sentiment even with a positive highlight', () => {
  for (const rating of [1, 2, 3]) {
    for (const review of buildReviewSuggestions({ rating, service: 'Haircut', highlights: ['Friendly staff'] })) {
      assert.match(review.text, /disappointing|fell short|could have been better|could be improved|okay overall/);
      assert.match(review.text, /friendly/);
      assert.doesNotMatch(review.text, /excellent|really good|Really enjoyed/);
    }
  }
});

test('empty and unknown highlights add no claims and detailed review includes all selected highlights', () => {
  const base = { rating: 5, service: 'Facial', highlights: [] };
  assert.deepEqual(buildReviewSuggestions(base), buildReviewSuggestions({ ...base, highlights: ['unknown'] }));
  const detailed = buildReviewSuggestions({ ...base, highlights: ['Clean salon', 'Quick service', 'Good communication'] })[2].text;
  assert.match(detailed, /clean and well maintained/);
  assert.match(detailed, /smooth and efficient/);
  assert.match(detailed, /listened carefully/);
});
