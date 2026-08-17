import { test, expect } from '@playwright/test';

test('logout clears the visible cart for the guest session', async ({ page }) => {
  const product = {
    _id: 'test-product-logout',
    name: 'Test Product',
    price: 100000,
    quantity: 1,
  };

  // Start with a clean browser storage state.
  await page.goto('/');
  await page.evaluate(({ product }) => {
    localStorage.clear();
    localStorage.setItem('token', 'test-session-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'Test Customer', email: 'test@example.com' })
    );
    localStorage.setItem('cart', JSON.stringify([product]));
  }, { product });

  // Reload so the app initializes from the authenticated session.
  await page.reload();

  // The authenticated cart should contain the test product.
  await page.goto('/cart');
  await expect(page.getByText('Test Product', { exact: true })).toBeVisible();

  // Logout through the real Navbar button.
  await page.getByRole('button', { name: 'Logout', exact: true }).click();

  await expect(page).toHaveURL(/login/);

  // Guest cart must now be empty.
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty', { exact: true })).toBeVisible();

  // Confirm the cart storage was cleared as well.
  const cartStorage = await page.evaluate(() => localStorage.getItem('cart'));
  expect(cartStorage).toBeNull();
});

test('guest cannot add products to the cart', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.reload();

  await page.goto('/cart');

  await expect(page.getByText('Your cart is empty', { exact: true })).toBeVisible();

  const cartStorage = await page.evaluate(() => localStorage.getItem('cart'));
  expect(cartStorage).toBeNull();
});

test('guest is redirected to login when adding a product from product detail', async ({ page }) => {
  await page.goto('/');

  // Start completely unauthenticated.
  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.reload();

  // Open the first real product from the homepage.
  const productLink = page.locator('a[href^="/product/"]').first();
  await expect(productLink).toBeVisible();

  await productLink.click();

  await expect(page).toHaveURL(/\/product\//);

  // The Add to Cart button should be available on the product detail page.
  const addToCartButton = page.getByRole('button', { name: /Add to Cart/i });
  await expect(addToCartButton).toBeVisible();

  // Guest must be sent to login instead of adding the product.
  await addToCartButton.click();

  await expect(page).toHaveURL(/\/login/);

  // Cart storage must remain empty/nonexistent.
  const cartStorage = await page.evaluate(() => localStorage.getItem('cart'));
  expect(cartStorage).toBeNull();
});
