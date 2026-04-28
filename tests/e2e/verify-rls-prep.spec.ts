import { test, expect, Request } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const BASE_URL = process.env.BASE_URL || 'https://trading-journal-six-lake.vercel.app';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('TEST_EMAIL or TEST_PASSWORD missing in .env.local');
}

function maskJwt(jwt: string): string {
  if (!jwt) return '(empty)';
  if (jwt.length < 30) return '(too-short)';
  return `${jwt.slice(0, 20)}...${jwt.slice(-4)}`;
}

test.describe('RLS Prep Verification', () => {
  test('full flow: login -> home positions -> JWT check -> detail page', async ({ page }) => {
    const consoleErrors: string[] = [];
    const supabaseRequests: Array<{ url: string; hasBearer: boolean; jwtMasked: string }> = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(`PageError: ${err.message}`);
    });

    page.on('request', (req: Request) => {
      const url = req.url();
      if (url.includes('supabase.co/rest/v1/') || url.includes('/positions')) {
        const auth = req.headers()['authorization'] || '';
        const hasBearer = auth.startsWith('Bearer ');
        const jwt = hasBearer ? auth.replace('Bearer ', '') : '';
        supabaseRequests.push({
          url: url.replace(/\?.*$/, ''),
          hasBearer,
          jwtMasked: maskJwt(jwt),
        });
      }
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', EMAIL!);
    await page.fill('input[type="password"]', PASSWORD!);
    await page.click('button[type="submit"]');

    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const homeUrl = page.url();
    console.log(`[INFO] After login URL: ${homeUrl}`);

    const positionLinkLocator = page.locator(
      'main a[href^="/"]:not([href="/"]):not([href="/login"]):not([href="/logout"])'
    );
    const positionLinks = await positionLinkLocator.count();
    console.log(`[INFO] Detected position-like links: ${positionLinks}`);

    let detailPageOk = false;
    try {
      if (positionLinks > 0) {
        const firstHref = await positionLinkLocator.first().getAttribute('href');
        console.log(`[INFO] First position href: ${firstHref}`);
        await positionLinkLocator.first().click();
        await page.waitForURL(
          url => {
            const u = new URL(url.toString());
            return u.pathname !== '/' && !u.pathname.includes('/login');
          },
          { timeout: 10000 }
        );
        await page.waitForLoadState('networkidle');
        const detailUrl = page.url();
        console.log(`[INFO] Detail page URL: ${detailUrl}`);
        detailPageOk = !detailUrl.includes('/login') && detailUrl !== homeUrl;
      }
    } catch (e) {
      console.log(`[WARN] Detail page navigation failed: ${e}`);
    }

    console.log('\n=== VERIFICATION REPORT ===');
    console.log(`[1] Site response: OK (HTTP reachable)`);
    console.log(`[2] Login: ${homeUrl.includes('/login') ? 'FAIL' : 'OK'}`);
    console.log(`[3] Position links found: ${positionLinks}`);
    console.log(`[4] Detail page render: ${detailPageOk ? 'OK' : 'FAIL'}`);
    console.log(`[5] Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    }
    console.log(`[6] Supabase requests captured: ${supabaseRequests.length}`);
    supabaseRequests.forEach((r, i) => {
      console.log(`    [${i + 1}] ${r.url}`);
      console.log(`        Bearer: ${r.hasBearer ? 'YES' : 'NO'}`);
      console.log(`        JWT (masked): ${r.jwtMasked}`);
    });

    const allBearerPresent = supabaseRequests.length > 0 &&
                             supabaseRequests.every(r => r.hasBearer);
    const noConsoleErrors = consoleErrors.length === 0;
    const loginSuccess = !homeUrl.includes('/login');

    console.log('\n=== JUDGMENT ===');
    console.log(`Login success: ${loginSuccess ? 'OK' : 'FAIL'}`);
    console.log(`Bearer in all Supabase requests: ${allBearerPresent ? 'OK' : 'FAIL'}`);
    console.log(`No console errors: ${noConsoleErrors ? 'OK' : 'FAIL'}`);
    console.log(`Detail page OK: ${detailPageOk ? 'OK' : 'FAIL'}`);

    const overallSuccess = loginSuccess && allBearerPresent && noConsoleErrors && detailPageOk;
    console.log(`\nOVERALL: ${overallSuccess ? 'SUCCESS' : 'FAIL'}`);

    expect.soft(loginSuccess, 'Login must succeed').toBe(true);
    expect.soft(allBearerPresent, 'All Supabase requests must have Bearer JWT').toBe(true);
    expect.soft(noConsoleErrors, 'No console errors expected').toBe(true);
    expect.soft(detailPageOk, 'Detail page must render').toBe(true);
  });
});
