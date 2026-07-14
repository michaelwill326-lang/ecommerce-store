import { test, expect } from '@playwright/test';

test('products section loads on homepage', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.tm-card');

  await expect(cards.first()).toBeVisible();
});


test('clicking a product opens product detail page', async ({ page }) => {
  await page.goto('/');

  await page.locator('.tm-card').first().click();

  await expect(page).toHaveURL(/product\//);
});
