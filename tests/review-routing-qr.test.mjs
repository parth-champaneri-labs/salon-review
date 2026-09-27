import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import { createSiteUrls, isConfiguredClientSlug, normalizeSiteUrl, siteConfig } from '../src/config/site.ts';
import { configuredReviewPath } from '../src/lib/routing/review-redirect.ts';
import { GET as qrResponse } from '../src/app/api/qr/review/route.ts';
import {
  createReviewQrSvg, QR_LOGO_ASSET, QR_LOGO_IMAGE_RATIO, QR_LOGO_PLATE_RATIO,
  REVIEW_QR_OPTIONS, REVIEW_QR_TARGET,
} from '../src/lib/qr/review-qr.ts';

test('site origin and derived client URLs are normalized and validated', () => {
  assert.equal(normalizeSiteUrl('https://lumenspirelabs.com/'), 'https://lumenspirelabs.com');
  assert.deepEqual(createSiteUrls('https://lumenspirelabs.com/', 'hair-driver'), {
    siteUrl: 'https://lumenspirelabs.com',
    reviewPath: '/review/hair-driver',
    qrRedirectPath: '/r/hair-driver',
    reviewUrl: 'https://lumenspirelabs.com/review/hair-driver',
    qrRedirectUrl: 'https://lumenspirelabs.com/r/hair-driver',
  });
  for (const invalid of ['javascript:alert(1)', 'https://example.com/path', 'https://example.com/?next=x', 'https://user:pass@example.com']) {
    assert.throws(() => normalizeSiteUrl(invalid));
  }
  assert.throws(() => createSiteUrls('https://lumenspirelabs.com', '../evil'));
  assert.equal(isConfiguredClientSlug('hair-driver'), true);
  assert.equal(isConfiguredClientSlug('unknown'), false);
});

test('production fallback and QR encode the canonical short URL', () => {
  const script = `
    import QRCode from 'qrcode';
    import { siteConfig } from './src/config/site.ts';
    import { createReviewQrSvg, REVIEW_QR_OPTIONS, REVIEW_QR_TARGET } from './src/lib/qr/review-qr.ts';
    import { GET } from './src/app/api/qr/review/route.ts';
    const svg = await createReviewQrSvg();
    const response = await GET(new Request('https://lumenspirelabs.com/api/qr/review?url=https://evil.example'));
    const expectedQr = await QRCode.toString(siteConfig.qrRedirectUrl, REVIEW_QR_OPTIONS);
    console.log(JSON.stringify({
      siteUrl: siteConfig.siteUrl,
      reviewUrl: siteConfig.reviewUrl,
      qrRedirectUrl: REVIEW_QR_TARGET,
      qrMatches: svg.startsWith(expectedQr.slice(0, -6)),
      apiMatches: (await response.text()) === svg,
    }));
  `;
  const { NEXT_PUBLIC_SITE_URL: unused, ...environment } = process.env;
  void unused;
  const output = execFileSync(process.execPath, [
    '--conditions=react-server', '--import', './tests/register.mjs', '--input-type=module', '-e', script,
  ], { encoding: 'utf8', env: { ...environment, NODE_ENV: 'production' } });
  const result = JSON.parse(output.trim());
  assert.deepEqual(result, {
    siteUrl: 'https://lumenspirelabs.com',
    reviewUrl: 'https://lumenspirelabs.com/review/hair-driver',
    qrRedirectUrl: 'https://lumenspirelabs.com/r/hair-driver',
    qrMatches: true,
    apiMatches: true,
  });
  assert.equal(new URL(result.qrRedirectUrl).hostname, 'lumenspirelabs.com');
});

test('short route target is the configured internal path and rejects unknown slugs', () => {
  assert.equal(configuredReviewPath(siteConfig.clientSlug), siteConfig.reviewPath);
  assert.equal(configuredReviewPath('unknown'), null);
  assert.equal(configuredReviewPath('https://evil.example'), null);
});

test('review QR uses the stable configured target and scan-safe options', async () => {
  assert.equal(REVIEW_QR_TARGET, siteConfig.qrRedirectUrl);
  assert.equal(REVIEW_QR_OPTIONS.errorCorrectionLevel, 'H');
  assert.ok(REVIEW_QR_OPTIONS.margin >= 4);
  assert.equal(REVIEW_QR_OPTIONS.color.light, '#FFFFFF');
  assert.ok(QR_LOGO_PLATE_RATIO <= 0.2);
  assert.ok(QR_LOGO_IMAGE_RATIO < QR_LOGO_PLATE_RATIO);
  await access(QR_LOGO_ASSET);

  const svg = await createReviewQrSvg();
  const plain = await QRCode.toString(siteConfig.qrRedirectUrl, REVIEW_QR_OPTIONS);
  assert.ok(svg.startsWith(plain.slice(0, -6)), 'logo overlay must preserve the configured QR modules');
  assert.match(svg, /<svg[^>]+viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /href="data:image\/png;base64,[A-Za-z0-9+/=]+"/);
  assert.doesNotMatch(svg, /href="https?:/);
  assert.doesNotMatch(svg, /<script/i);
  assert.doesNotMatch(svg, /GEMINI_API_KEY|REVIEW_COOKIE_SECRET/);
});

test('unavailable logo falls back to the exact standard QR SVG', async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const svg = await createReviewQrSvg(async () => { throw new Error('missing'); });
    const plain = await QRCode.toString(siteConfig.qrRedirectUrl, REVIEW_QR_OPTIONS);
    assert.equal(svg, plain);
    assert.doesNotMatch(svg, /<image/);
  } finally {
    console.warn = originalWarn;
  }
});

test('QR API returns a non-sniffable SVG and ignores arbitrary destination parameters', async () => {
  const normal = await qrResponse(new Request('http://localhost:3000/api/qr/review?url=https://evil.example&text=evil'));
  const download = await qrResponse(new Request('http://localhost:3000/api/qr/review?download=1&url=https://evil.example'));
  assert.equal(normal.status, 200);
  assert.match(normal.headers.get('content-type'), /^image\/svg\+xml/);
  assert.equal(normal.headers.get('x-content-type-options'), 'nosniff');
  assert.match(normal.headers.get('content-disposition'), /^inline;/);
  assert.match(download.headers.get('content-disposition'), /^attachment;/);
  assert.equal(await normal.text(), await download.text());
});

test('provided browser icon and QR brand asset are PNGs', async () => {
  const icon = await readFile('src/app/icon.png');
  const logo = await readFile(QR_LOGO_ASSET);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(icon.subarray(0, 8).equals(signature));
  assert.ok(logo.subarray(0, 8).equals(signature));
  const layout = await readFile('src/app/layout.tsx', 'utf8');
  assert.match(layout, /icons: \{ icon: "\/icon\.png" \}/);
});
