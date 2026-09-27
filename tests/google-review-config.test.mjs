import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { normalizeGoogleReviewUrl, siteConfig } from '../src/config/site.ts';

const officialReviewUrl = 'https://g.page/r/CXyzMGBwIejGEAE/review';

test('configured Google review destination is a valid HTTPS review URL', () => {
  assert.equal(siteConfig.googleReviewUrl, officialReviewUrl);
  assert.equal(normalizeGoogleReviewUrl(officialReviewUrl), officialReviewUrl);
  const parsed = new URL(siteConfig.googleReviewUrl);
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'g.page');
});

test('Google review destination rejects unsafe, malformed, and external URLs', () => {
  for (const value of [
    'javascript:alert(1)', 'data:text/html,unsafe', 'file:///review', 'not-a-url',
    'http://g.page/r/id/review', 'https://example.com/review',
    'https://g.page.evil.example/review', 'https://user:pass@g.page/review',
  ]) {
    assert.throws(() => normalizeGoogleReviewUrl(value), { message: /NEXT_PUBLIC_GOOGLE_REVIEW_URL/ });
  }
});

test('environment override changes the destination without editing components', async () => {
  const alternative = 'https://g.page/r/NEW_GOOGLE_REVIEW_ID/review';
  const output = execFileSync(process.execPath, [
    '--import', './tests/register.mjs', '--input-type=module', '-e',
    "import { siteConfig } from './src/config/site.ts'; console.log(siteConfig.googleReviewUrl)",
  ], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_GOOGLE_REVIEW_URL: alternative } });
  assert.equal(output.trim(), alternative);

  const component = await readFile('src/components/review/ReviewResults.tsx', 'utf8');
  assert.match(component, /href=\{siteConfig\.googleReviewUrl\}/g);
  assert.doesNotMatch(component, /g\.page|google\.com/);
});
