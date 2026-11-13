# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-protected-routes.spec.js >> Protected Routes & Role Guards >> candidate trying to access /interviews/create redirects to /unauthorized
- Location: tests\e2e\02-protected-routes.spec.js:41:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*unauthorized/
Received string:  "http://127.0.0.1:5173/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    - locator resolved to <html lang="en">…</html>
    - unexpected value "http://127.0.0.1:5173/interviews/create"
    22 × locator resolved to <html lang="en">…</html>
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
  4  | const MOCK_INTERVIEWS = {
  5  |   success: true,
  6  |   data: [],
  7  |   pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  8  | };
  9  | 
  10 | test.describe("Protected Routes & Role Guards", () => {
  11 |   test("candidate can access /dashboard", async ({ page }) => {
  12 |     await mockAuthMe(page, "candidate");
  13 |     await loginAs(page, "candidate");
  14 |     await page.route("**/api/interviews/my**", (r) =>
  15 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS) })
  16 |     );
  17 |     await page.goto("/dashboard");
  18 |     await expect(page).not.toHaveURL(/.*login/);
  19 |   });
  20 | 
  21 |   test("interviewer can access /dashboard", async ({ page }) => {
  22 |     await mockAuthMe(page, "interviewer");
  23 |     await loginAs(page, "interviewer");
  24 |     await page.route("**/api/interviews/my**", (r) =>
  25 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS) })
  26 |     );
  27 |     await page.goto("/dashboard");
  28 |     await expect(page).not.toHaveURL(/.*login/);
  29 |   });
  30 | 
  31 |   test("admin can access /dashboard", async ({ page }) => {
  32 |     await mockAuthMe(page, "admin");
  33 |     await loginAs(page, "admin");
  34 |     await page.route("**/api/**", (r) =>
  35 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: {} }) })
  36 |     );
  37 |     await page.goto("/dashboard");
  38 |     await expect(page).not.toHaveURL(/.*login/);
  39 |   });
  40 | 
  41 |   test("candidate trying to access /interviews/create redirects to /unauthorized", async ({ page }) => {
  42 |     await mockAuthMe(page, "candidate");
  43 |     await loginAs(page, "candidate");
  44 |     await page.goto("/interviews/create");
> 45 |     await expect(page).toHaveURL(/.*unauthorized/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  46 |   });
  47 | 
  48 |   test("candidate trying to access /admin redirects to /unauthorized", async ({ page }) => {
  49 |     await mockAuthMe(page, "candidate");
  50 |     await loginAs(page, "candidate");
  51 |     await page.goto("/admin");
  52 |     await expect(page).toHaveURL(/.*unauthorized/);
  53 |   });
  54 | 
  55 |   test("interviewer trying to access /admin redirects to /unauthorized", async ({ page }) => {
  56 |     await mockAuthMe(page, "interviewer");
  57 |     await loginAs(page, "interviewer");
  58 |     await page.goto("/admin");
  59 |     await expect(page).toHaveURL(/.*unauthorized/);
  60 |   });
  61 | 
  62 |   test("candidate can access /interviews/join", async ({ page }) => {
  63 |     await mockAuthMe(page, "candidate");
  64 |     await loginAs(page, "candidate");
  65 |     await page.goto("/interviews/join");
  66 |     await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  67 |     await expect(page.getByText(/join/i).first()).toBeVisible();
  68 |   });
  69 | 
  70 |   test("interviewer can access /interviews/create", async ({ page }) => {
  71 |     await mockAuthMe(page, "interviewer");
  72 |     await loginAs(page, "interviewer");
  73 |     await page.route("**/api/problems**", (r) =>
  74 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
  75 |     );
  76 |     await page.goto("/interviews/create");
  77 |     await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  78 |   });
  79 | 
  80 |   test("candidate trying to access /evaluations redirects to /unauthorized", async ({ page }) => {
  81 |     await mockAuthMe(page, "candidate");
  82 |     await loginAs(page, "candidate");
  83 |     await page.goto("/evaluations");
  84 |     await expect(page).toHaveURL(/.*unauthorized/);
  85 |   });
  86 | });
  87 | 
```