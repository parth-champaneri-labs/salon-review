import test from 'node:test';
import assert from 'node:assert/strict';
import { handleReviewRequest } from '../src/lib/ai/review-request.ts';
import { generateReviewDrafts, PRIMARY_MODEL } from '../src/lib/ai/gemini.ts';
import { draftLabels } from '../src/lib/review-contract.ts';
import {
  GENERATION_COOKIE_NAME, generationCookieHeader, readGenerationCount,
  signGenerationCookie, verifyGenerationCookie,
} from '../src/lib/review-generation-cookie.ts';

const secret = 'test-secret-with-at-least-thirty-two-characters';
process.env.REVIEW_COOKIE_SECRET = secret;

const drafts = [
  { type: 'natural', label: draftLabels.natural, text: 'Really liked my haircut.' },
  { type: 'short', label: draftLabels.short, text: 'Nice haircut.' },
  { type: 'hinglish', label: draftLabels.hinglish, text: 'Haircut kaafi acha laga.' },
];

function request(cookie, service = 'Haircut') {
  return new Request('http://localhost/api/generate-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ service }),
  });
}

function cookieFrom(response) {
  return response.headers.get('Set-Cookie')?.split(';')[0];
}

test('three successful generations consume one count each and the fourth never calls Gemini', async () => {
  let cookie;
  let calls = 0;
  for (let used = 1; used <= 3; used++) {
    const response = await handleReviewRequest(request(cookie), async () => { calls++; return drafts; });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).generation, { used, remaining: 3 - used, limit: 3 });
    cookie = cookieFrom(response);
    assert.equal(readGenerationCount(request(cookie), secret), used);
  }
  const blocked = await handleReviewRequest(request(cookie), async () => { calls++; return drafts; });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Generation limit reached.', remaining: 0, limitReached: true,
    generation: { used: 3, remaining: 0, limit: 3 },
  });
  assert.equal(calls, 3);
  assert.equal(blocked.headers.get('Set-Cookie'), null);
  assert.equal(readGenerationCount(request(cookie), secret), 3);
});

test('bad signature, tampered count, expired or malformed payload starts fresh', async () => {
  const valid = signGenerationCookie(3, Date.now() + 60_000, secret);
  const [payload, signature] = valid.split('.');
  const tampered = Buffer.from(JSON.stringify({ count: 0, expiresAt: Date.now() + 60_000 })).toString('base64url');
  for (const value of [
    `${payload}.${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`, `${tampered}.${signature}`,
    signGenerationCookie(3, Date.now() - 1, secret),
    signGenerationCookie(4, Date.now() + 60_000, secret),
    'not-a-valid-cookie',
  ]) {
    assert.equal(verifyGenerationCookie(value, secret), 0);
    const response = await handleReviewRequest(request(`${GENERATION_COOKIE_NAME}=${value}`), async () => drafts);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).generation.used, 1);
  }
});

test('primary failure followed by fallback success consumes one generation', async () => {
  let modelCalls = 0;
  const response = await handleReviewRequest(request(), input => generateReviewDrafts(input, async model => {
    modelCalls++;
    if (model === PRIMARY_MODEL) throw { status: 503 };
    return drafts;
  }));
  assert.equal(response.status, 200);
  assert.equal(modelCalls, 2);
  assert.equal((await response.json()).generation.used, 1);
  assert.equal(readGenerationCount(request(cookieFrom(response)), secret), 1);
});

test('provider failure and invalid request do not consume a generation', async () => {
  let calls = 0;
  const fail = await handleReviewRequest(request(), async () => { calls++; throw { status: 503 }; });
  assert.equal(fail.status, 502);
  assert.equal(fail.headers.get('Set-Cookie'), null);
  const invalid = await handleReviewRequest(request(undefined, 'Unknown service'), async () => { calls++; return drafts; });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('Set-Cookie'), null);
  assert.equal(calls, 1);
  const retry = await handleReviewRequest(request(), async () => drafts);
  assert.equal((await retry.json()).generation.used, 1);
});

test('both model failures and invalid draft output leave the cookie unchanged', async () => {
  const existing = `${GENERATION_COOKIE_NAME}=${signGenerationCookie(1, Date.now() + 60_000, secret)}`;
  let modelCalls = 0;
  const failed = await handleReviewRequest(request(existing), input => generateReviewDrafts(input, async () => {
    modelCalls++;
    throw { status: 503 };
  }));
  assert.equal(failed.status, 502);
  assert.equal(modelCalls, 2);
  assert.equal(failed.headers.get('Set-Cookie'), null);
  assert.equal(readGenerationCount(request(existing), secret), 1);

  const malformed = await handleReviewRequest(request(existing), async () => drafts.slice(0, 2));
  assert.equal(malformed.status, 502);
  assert.equal(malformed.headers.get('Set-Cookie'), null);
  assert.equal(readGenerationCount(request(existing), secret), 1);
});

test('missing secret fails before provider call', async () => {
  const original = process.env.REVIEW_COOKIE_SECRET;
  delete process.env.REVIEW_COOKIE_SECRET;
  try {
    let calls = 0;
    const response = await handleReviewRequest(request(), async () => { calls++; return drafts; });
    assert.equal(response.status, 503);
    assert.equal(calls, 0);
    assert.equal(response.headers.get('Set-Cookie'), null);
  } finally {
    process.env.REVIEW_COOKIE_SECRET = original;
  }
});

test('cookie attributes support local HTTP and production HTTPS', () => {
  const local = generationCookieHeader(1, secret, Date.now(), false);
  assert.match(local, /Max-Age=43200; Path=\/; HttpOnly; SameSite=Lax/);
  assert.doesNotMatch(local, /; Secure/);
  const production = generationCookieHeader(1, secret, Date.now(), true);
  assert.match(production, /; Secure$/);
});
