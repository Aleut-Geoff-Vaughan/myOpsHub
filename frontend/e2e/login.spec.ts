import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page elements', async ({ page }) => {
    // Check page title and branding
    await expect(page.getByText('myScheduling')).toBeVisible();
    await expect(page.getByText('Project Scheduling & Resource Management')).toBeVisible();

    // Check form elements
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with password/i })).toBeVisible();
  });

  test('should show system status section', async ({ page }) => {
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('API:')).toBeVisible();
    await expect(page.getByText('Database:')).toBeVisible();
  });

  test('should allow switching to magic link mode', async ({ page }) => {
    // Click magic link button
    await page.getByRole('button', { name: /sign in with email link/i }).click();

    // Should show passwordless sign in content
    await expect(page.getByText(/passwordless sign in/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();

    // Should have back button
    await expect(page.getByRole('button', { name: /back to password login/i })).toBeVisible();
  });

  test('should allow returning to password mode from magic link mode', async ({ page }) => {
    // Switch to magic link mode
    await page.getByRole('button', { name: /sign in with email link/i }).click();
    await expect(page.getByText(/passwordless sign in/i)).toBeVisible();

    // Go back to password mode
    await page.getByRole('button', { name: /back to password login/i }).click();

    // Should be back to password form
    await expect(page.getByRole('button', { name: /sign in with password/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation for empty form submission', async ({ page }) => {
    // Try to submit without filling the form
    const submitButton = page.getByRole('button', { name: /sign in with password/i });

    // The button should be present
    await expect(submitButton).toBeVisible();

    // HTML5 validation should prevent submission (email and password are required)
    await submitButton.click();

    // Email field should still be visible (form wasn't submitted)
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });

  test('should allow typing in form fields', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i);
    const passwordInput = page.getByLabel(/password/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should remember checkbox be checked by default', async ({ page }) => {
    const rememberMeCheckbox = page.getByLabel(/remember me/i);
    await expect(rememberMeCheckbox).toBeChecked();
  });

  test('should toggle remember me checkbox', async ({ page }) => {
    const rememberMeCheckbox = page.getByLabel(/remember me/i);

    // Should be checked by default
    await expect(rememberMeCheckbox).toBeChecked();

    // Uncheck
    await rememberMeCheckbox.click();
    await expect(rememberMeCheckbox).not.toBeChecked();

    // Check again
    await rememberMeCheckbox.click();
    await expect(rememberMeCheckbox).toBeChecked();
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should display footer with copyright', async ({ page }) => {
    await expect(page.getByText(/2025 myScheduling/)).toBeVisible();
  });
});

test.describe('Login Flow', () => {
  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.getByLabel(/email address/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in with password/i }).click();

    // Should show error message (this test requires API to be running)
    // We expect an error toast or inline error message
    // Note: This test may fail if API is not running - that's expected
    await expect(page.getByText(/invalid credentials/i).or(page.getByText(/error/i))).toBeVisible({ timeout: 10000 });
  });
});
