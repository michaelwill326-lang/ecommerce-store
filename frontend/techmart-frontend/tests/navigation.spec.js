import { test, expect } from '@playwright/test';

test('main navigation links work', async ({ page }) => {
  await page.goto('/');

  // Navbar exists
  await expect(page.locator('nav:not(.techmart-bottom-nav)')).toBeVisible();

  // Orders link
  await page.getByText('Orders', { exact: true }).click();
  await expect(page).toHaveURL(/tracking/);

  // Pay link
  await page.goto('/');
  await page.getByRole('link', { name: 'Pay', exact: true }).click();
  await expect(page).toHaveURL(/pay/);

  // Login link (guest user)
  await page.goto('/');
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
