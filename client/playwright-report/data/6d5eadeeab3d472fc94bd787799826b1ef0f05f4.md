# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-create-interview.spec.js >> Create Interview (Interviewer) >> create interview page has a submit/create button
- Location: tests\e2e\06-create-interview.spec.js:43:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /create|schedule|submit/i }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /create|schedule|submit/i }).first() with timeout 10000ms
  - waiting for getByRole('button', { name: /create|schedule|submit/i }).first()

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
  4  | test.describe("Create Interview (Interviewer)", () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await mockAuthMe(page, "interviewer");
  7  |     await loginAs(page, "interviewer");
  8  |     await page.route("**/api/problems**", (r) =>
  9  |       r.fulfill({
  10 |         status: 200,
  11 |         contentType: "application/json",
  12 |         body: JSON.stringify({
  13 |           success: true,
  14 |           data: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  15 |           pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  16 |         }),
  17 |       })
  18 |     );
  19 |   });
  20 | 
  21 |   test("create interview form renders title field", async ({ page }) => {
  22 |     await page.goto("/interviews/create");
  23 |     await expect(page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first()).toBeVisible();
  24 |   });
  25 | 
  26 |   test("create interview form renders description field", async ({ page }) => {
  27 |     await page.goto("/interviews/create");
  28 |     await expect(page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i)).first()).toBeVisible();
  29 |   });
  30 | 
  31 |   test("create interview form renders duration field", async ({ page }) => {
  32 |     await page.goto("/interviews/create");
  33 |     await expect(page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first()).toBeVisible();
  34 |   });
  35 | 
  36 |   test("create interview form renders scheduled date field", async ({ page }) => {
  37 |     await page.goto("/interviews/create");
  38 |     // Look for a datetime-local input or date picker
  39 |     const dateInput = page.locator("input[type='datetime-local'], input[type='date']");
  40 |     await expect(dateInput.first()).toBeVisible();
  41 |   });
  42 | 
  43 |   test("create interview page has a submit/create button", async ({ page }) => {
  44 |     await page.goto("/interviews/create");
> 45 |     await expect(page.getByRole("button", { name: /create|schedule|submit/i }).first()).toBeVisible();
     |                                                                                         ^ Error: expect(locator).toBeVisible() failed
  46 |   });
  47 | 
  48 |   test("form has problem selection section", async ({ page }) => {
  49 |     await page.goto("/interviews/create");
  50 |     await expect(page.getByText(/problem|select problem/i).first()).toBeVisible();
  51 |   });
  52 | 
  53 |   test("successful interview creation redirects away from create page", async ({ page }) => {
  54 |     await page.route("**/api/interviews", (r) => {
  55 |       if (r.request().method() === "POST") {
  56 |         r.fulfill({
  57 |           status: 201,
  58 |           contentType: "application/json",
  59 |           body: JSON.stringify({
  60 |             success: true,
  61 |             data: { _id: "intv-new", title: "New Interview", status: "scheduled", roomCode: "CC-AABBCCDD" },
  62 |           }),
  63 |         });
  64 |       } else {
  65 |         r.continue();
  66 |       }
  67 |     });
  68 |     await page.route("**/api/interviews/my**", (r) =>
  69 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
  70 |     );
  71 |     await page.goto("/interviews/create");
  72 |     // Fill title
  73 |     const titleField = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first();
  74 |     await titleField.fill("Test Interview");
  75 |     // Fill duration
  76 |     const durationField = page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first();
  77 |     await durationField.fill("60");
  78 |     // Submit
  79 |     await page.getByRole("button", { name: /create|schedule|submit/i }).first().click();
  80 |     // Should redirect to interviews list
  81 |     await expect(page).toHaveURL(/\/interviews($|\?|\/[a-f0-9])/);
  82 |   });
  83 | });
  84 | 
```