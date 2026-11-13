import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

test.describe("Authentication", () => {
  test("unauthenticated user visiting /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("unauthenticated user visiting /problems redirects to /login", async ({ page }) => {
    await page.goto("/problems");
    await expect(page).toHaveURL(/.*login/);
  });

  test("unauthenticated user visiting /interviews redirects to /login", async ({ page }) => {
    await page.goto("/interviews");
    await expect(page).toHaveURL(/.*login/);
  });

  test("unauthenticated user visiting /notifications redirects to /login", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/.*login/);
  });

  test("login page renders email field, sign in button, create account link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  });

  test("login page renders password field", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test("register page renders role selector buttons", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^candidate/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^interviewer/i })).toBeVisible();
  });

  test("register page renders all form fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /^candidate/i }).click();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("login form empty submit keeps user on /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test("/unauthorized page renders correctly", async ({ page }) => {
    await page.goto("/unauthorized");
    await expect(page.getByText(/unauthorized|access denied|403/i).first()).toBeVisible();
  });

  test("authenticated user visiting /login redirects to /dashboard", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/login");
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("authenticated user visiting /register redirects to /dashboard", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/register");
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
