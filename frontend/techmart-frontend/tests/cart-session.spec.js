import { test, expect } from '@playwright/test';

test('logout clears the visible cart for the guest session', async ({ page }) => {
  const product = {
    _id: 'test-product-logout',
    name: 'Test Product',
    price: 100000,
    quantity: 1,
  };

  await page.route('**/api/cart', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [product] }),
    })
  );

  await page.route('**/api/cart/sync', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  );

  await page.route('**/api/auth/logout', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  );

  // Seed the browser session before React initializes.
  await page.addInitScript(({ product }) => {
    if (sessionStorage.getItem('__playwrightCartSeeded')) return;

    sessionStorage.setItem('__playwrightCartSeeded', '1');
    sessionStorage.setItem('token', 'test-session-token');
    sessionStorage.setItem(
      'user',
      JSON.stringify({ name: 'Test Customer', email: 'test@example.com' })
    );
    localStorage.setItem('cart', JSON.stringify([product]));
  }, { product });

  await page.goto('/cart');
  await expect(page.getByText('Test Product', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/login/);

  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty', { exact: true })).toBeVisible();

  const result = await page.evaluate(() => ({
    cart: localStorage.getItem('cart'),
    token: sessionStorage.getItem('token'),
    user: sessionStorage.getItem('user'),
  }));

  expect(result.cart).toBeNull();
  expect(result.token).toBeNull();
  expect(result.user).toBeNull();
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
  await page.goto('/shop');

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
