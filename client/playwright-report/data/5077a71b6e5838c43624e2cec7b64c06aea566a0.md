# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.js >> Authentication >> authenticated user visiting /login redirects to /dashboard
- Location: tests\e2e\01-auth.spec.js:63:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://127.0.0.1:5173/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    23 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://127.0.0.1:5173/login"

```

```yaml
- link "CodeCollab":
  - /url: /
- text: Collaborative coding starts here
- heading "Think together. Code together. Succeed together." [level=1]
- paragraph: A collaborative space for technical interviews, coding challenges and real-time problem solving.
- heading "Powerful coding workspace" [level=3]
- paragraph: Write and execute code in multiple languages.
- heading "Real-time collaboration" [level=3]
- paragraph: Work together in a shared interview room.
- heading "Structured evaluations" [level=3]
- paragraph: Track performance with interview scorecards.
- paragraph: © 2026 CodeCollab. Built for better technical interviews.
- heading "Welcome back" [level=2]
- paragraph: Sign in to continue to your CodeCollab workspace.
- text: Email address
- textbox "Email address":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
- button "Show password"
- button "Sign in"
- text: NEW TO CODECOLLAB?
- paragraph:
  - text: Don't have an account?
  - link "Create account":
    - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { loginAs, mockAuthMe } from "./helpers/auth.js";
  3  | 
  4  | test.describe("Authentication", () => {
  5  |   test("unauthenticated user visiting /dashboard redirects to /login", async ({ page }) => {
  6  |     await page.goto("/dashboard");
  7  |     await expect(page).toHaveURL(/.*login/);
  8  |     await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  9  |   });
  10 | 
  11 |   test("unauthenticated user visiting /problems redirects to /login", async ({ page }) => {
  12 |     await page.goto("/problems");
  13 |     await expect(page).toHaveURL(/.*login/);
  14 |   });
  15 | 
  16 |   test("unauthenticated user visiting /interviews redirects to /login", async ({ page }) => {
  17 |     await page.goto("/interviews");
  18 |     await expect(page).toHaveURL(/.*login/);
  19 |   });
  20 | 
  21 |   test("unauthenticated user visiting /notifications redirects to /login", async ({ page }) => {
  22 |     await page.goto("/notifications");
  23 |     await expect(page).toHaveURL(/.*login/);
  24 |   });
  25 | 
  26 |   test("login page renders email field, sign in button, create account link", async ({ page }) => {
  27 |     await page.goto("/login");
  28 |     await expect(page.getByLabel(/email address/i)).toBeVisible();
  29 |     await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  30 |     await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
  31 |   });
  32 | 
  33 |   test("login page renders password field", async ({ page }) => {
  34 |     await page.goto("/login");
  35 |     await expect(page.getByLabel(/password/i).first()).toBeVisible();
  36 |   });
  37 | 
  38 |   test("register page renders role selector buttons", async ({ page }) => {
  39 |     await page.goto("/register");
  40 |     await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  41 |     await expect(page.getByRole("button", { name: /^candidate/i })).toBeVisible();
  42 |     await expect(page.getByRole("button", { name: /^interviewer/i })).toBeVisible();
  43 |   });
  44 | 
  45 |   test("register page renders all form fields", async ({ page }) => {
  46 |     await page.goto("/register");
  47 |     await page.getByRole("button", { name: /^candidate/i }).click();
  48 |     await expect(page.getByLabel(/full name/i)).toBeVisible();
  49 |     await expect(page.getByLabel(/email/i)).toBeVisible();
  50 |   });
  51 | 
  52 |   test("login form empty submit keeps user on /login", async ({ page }) => {
  53 |     await page.goto("/login");
  54 |     await page.getByRole("button", { name: /sign in/i }).click();
  55 |     await expect(page).toHaveURL(/.*login/);
  56 |   });
  57 | 
  58 |   test("/unauthorized page renders correctly", async ({ page }) => {
  59 |     await page.goto("/unauthorized");
  60 |     await expect(page.getByText(/unauthorized|access denied|403/i).first()).toBeVisible();
  61 |   });
  62 | 
  63 |   test("authenticated user visiting /login redirects to /dashboard", async ({ page }) => {
  64 |     await mockAuthMe(page, "candidate");
  65 |     await loginAs(page, "candidate");
  66 |     await page.goto("/login");
> 67 |     await expect(page).toHaveURL(/.*dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  68 |   });
  69 | 
  70 |   test("authenticated user visiting /register redirects to /dashboard", async ({ page }) => {
  71 |     await mockAuthMe(page, "candidate");
  72 |     await loginAs(page, "candidate");
  73 |     await page.goto("/register");
  74 |     await expect(page).toHaveURL(/.*dashboard/);
  75 |   });
  76 | });
  77 | 
```