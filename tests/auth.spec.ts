import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('signup success', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign up")');
    // Assuming no email confirm, redirects to /games
    await expect(page).toHaveURL(/\/games/);
  });

  test('login success', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Log in")');
    await expect(page).toHaveURL(/\/games/);
  });

  test('bad credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'bad@example.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("Log in")');
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });
});