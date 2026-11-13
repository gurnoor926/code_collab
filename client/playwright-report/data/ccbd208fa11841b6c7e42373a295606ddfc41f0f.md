# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-join-interview.spec.js >> Join Interview (Candidate) >> join interview page renders heading
- Location: tests\e2e\07-join-interview.spec.js:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /join/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /join/i }) with timeout 10000ms
  - waiting for getByRole('heading', { name: /join/i })

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
  4  | test.describe("Join Interview (Candidate)", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await mockAuthMe(page, "candidate");
  7  |     await loginAs(page, "candidate");
  8  |   });
  9  | 
  10 |   test("join interview page renders heading", async ({ page }) => {
  11 |     await page.goto("/interviews/join");
> 12 |     await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  13 |   });
  14 | 
  15 |   test("join interview page has room code input", async ({ page }) => {
  16 |     await page.goto("/interviews/join");
  17 |     await expect(page.getByPlaceholder(/CC-|room code|invitation/i)).toBeVisible();
  18 |   });
  19 | 
  20 |   test("join interview page has submit button", async ({ page }) => {
  21 |     await page.goto("/interviews/join");
  22 |     await expect(page.getByRole("button", { name: /join/i }).first()).toBeVisible();
  23 |   });
  24 | 
  25 |   test("submitting invalid code shows error", async ({ page }) => {
  26 |     await page.goto("/interviews/join");
  27 |     const input = page.getByPlaceholder(/CC-|room code|invitation/i);
  28 |     await input.fill("BADCODE");
  29 |     await page.getByRole("button", { name: /join/i }).first().click();
  30 |     await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();
  31 |   });
  32 | 
  33 |   test("submitting another invalid code format shows error", async ({ page }) => {
  34 |     await page.goto("/interviews/join");
  35 |     const input = page.getByPlaceholder(/CC-|room code|invitation/i);
  36 |     await input.fill("CC-12345");
  37 |     await page.getByRole("button", { name: /join/i }).first().click();
  38 |     await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();
  39 |   });
  40 | 
  41 |   test("submitting valid code CC-A1B2C3D4 triggers API call", async ({ page }) => {
  42 |     let apiCalled = false;
  43 |     await page.route("**/api/interviews/join", (r) => {
  44 |       apiCalled = true;
  45 |       r.fulfill({
  46 |         status: 200,
  47 |         contentType: "application/json",
  48 |         body: JSON.stringify({ success: true, data: { _id: "intv-001" } }),
  49 |       });
  50 |     });
  51 |     await page.route("**/api/interviews/my**", (r) =>
  52 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
  53 |     );
  54 |     await page.goto("/interviews/join");
  55 |     const input = page.getByPlaceholder(/CC-|room code|invitation/i);
  56 |     await input.fill("CC-A1B2C3D4");
  57 |     await page.getByRole("button", { name: /join/i }).first().click();
  58 |     await page.waitForTimeout(1000);
  59 |     expect(apiCalled).toBe(true);
  60 |   });
  61 | });
  62 | 
```