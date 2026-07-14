import { test } from '@playwright/test';

test('debug rendered page', async ({ page }) => {
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('/');

  await page.waitForTimeout(3000);

  console.log('TITLE:', await page.title());

  console.log(
    'HTML:',
    (await page.locator('body').innerText()).slice(0,500)
  );
});
