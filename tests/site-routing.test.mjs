import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { createSiteUrls, isConfiguredClientSlug, normalizeSiteUrl } from '../src/config/site.ts';

function configFor(environment, { unsetSiteUrl = false } = {}) {
  const childEnv = { ...process.env, ...environment };
  if (unsetSiteUrl) delete childEnv.NEXT_PUBLIC_SITE_URL;
  const output = execFileSync(process.execPath, [
    '--import', './tests/register.mjs', '--input-type=module', '-e',
    "import { siteConfig } from './src/config/site.ts'; console.log(JSON.stringify(siteConfig))",
  ], { encoding: 'utf8', env: childEnv });
  return JSON.parse(output.trim());
}

test('development origin and single-client review path are configured', () => {
  const config = configFor({
    NODE_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_COMPANY_URL: 'https://lumenspirelabs.com',
  });
  assert.equal(config.siteUrl, 'http://localhost:3000');
  assert.equal(config.companyUrl, 'https://lumenspirelabs.com');
  assert.equal(config.reviewPath, '/review/hair-driver');
  assert.equal(config.reviewUrl, 'http://localhost:3000/review/hair-driver');
  assert.equal(isConfiguredClientSlug('hair-driver'), true);
  assert.equal(isConfiguredClientSlug('unknown'), false);
});

test('production origin derives the Hair Driver review URL and retains the company URL', () => {
  const config = configFor({
    NODE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://hairdriver.lumenspirelabs.com',
    NEXT_PUBLIC_COMPANY_URL: 'https://lumenspirelabs.com',
  });
  assert.deepEqual(createSiteUrls(config.siteUrl, config.clientSlug), {
    siteUrl: 'https://hairdriver.lumenspirelabs.com',
    reviewPath: '/review/hair-driver',
    reviewUrl: 'https://hairdriver.lumenspirelabs.com/review/hair-driver',
  });
  assert.equal(config.companyUrl, 'https://lumenspirelabs.com');
  assert.equal(config.reviewUrl, 'https://hairdriver.lumenspirelabs.com/review/hair-driver');
});

test('production fallback uses the salon subdomain when the site URL is unset', () => {
  const config = configFor({ NODE_ENV: 'production' }, { unsetSiteUrl: true });
  assert.equal(config.siteUrl, 'https://hairdriver.lumenspirelabs.com');
});

test('origins and client slugs reject unsafe URLs and malformed values', () => {
  assert.equal(normalizeSiteUrl('https://hairdriver.lumenspirelabs.com/'), 'https://hairdriver.lumenspirelabs.com');
  for (const invalid of ['javascript:alert(1)', 'https://example.com/path', 'https://example.com/?next=x', 'https://user:pass@example.com']) {
    assert.throws(() => normalizeSiteUrl(invalid));
  }
  assert.throws(() => createSiteUrls('https://hairdriver.lumenspirelabs.com', '../evil'));
  assert.throws(() => normalizeSiteUrl('https://example.com/path', 'NEXT_PUBLIC_COMPANY_URL'), { message: /NEXT_PUBLIC_COMPANY_URL/ });
});

test('root redirects server-side and review route still guards unknown clients', async () => {
  const root = await readFile('src/app/page.tsx', 'utf8');
  const review = await readFile('src/app/review/[slug]/page.tsx', 'utf8');
  assert.match(root, /import \{ redirect \} from "next\/navigation"/);
  assert.match(root, /redirect\(siteConfig\.reviewPath\)/);
  assert.match(review, /if \(!isConfiguredClientSlug\(slug\)\) notFound\(\)/);
});

test('branded 404 links to the company origin and the local review path', async () => {
  const notFound = await readFile('src/app/not-found.tsx', 'utf8');
  assert.match(notFound, /href=\{siteConfig\.companyUrl\}>Go to Lumenspire/);
  assert.match(notFound, /href=\{siteConfig\.reviewPath\}>Open review page/);
  assert.doesNotMatch(notFound, /href=\{siteConfig\.siteUrl\}/);
});

test('salon project has no permanent QR route or QR API', async () => {
  await assert.rejects(access('src/app/r/[slug]/page.tsx'));
  await assert.rejects(access('src/app/api/qr/review/route.ts'));
  const siteConfigSource = await readFile('src/config/site.ts', 'utf8');
  assert.doesNotMatch(siteConfigSource, /qrRedirect/);
});

test('browser favicon remains the supplied PNG', async () => {
  const icon = await readFile('src/app/icon.png');
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(icon.subarray(0, 8).equals(signature));
  const layout = await readFile('src/app/layout.tsx', 'utf8');
  assert.match(layout, /icons: \{ icon: "\/icon\.png" \}/);
});
