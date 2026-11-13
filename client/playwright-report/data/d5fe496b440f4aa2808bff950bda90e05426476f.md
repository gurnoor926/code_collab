# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-create-interview.spec.js >> Create Interview (Interviewer) >> successful interview creation redirects away from create page
- Location: tests\e2e\06-create-interview.spec.js:53:3

# Error details

```
TimeoutError: locator.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for getByLabel(/title/i).or(getByPlaceholder(/title/i)).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - link "CodeCollab" [ref=e7] [cursor=pointer]:
      - /url: /
    - generic [ref=e14]:
      - generic [ref=e15]: Collaborative coding starts here
      - heading "Think together. Code together. Succeed together." [level=1] [ref=e17]: Think together.Code together.Succeed together.
      - paragraph [ref=e18]: A collaborative space for technical interviews, coding challenges and real-time problem solving.
      - generic [ref=e19]:
        - generic [ref=e24]:
          - heading "Powerful coding workspace" [level=3] [ref=e25]
          - paragraph [ref=e26]: Write and execute code in multiple languages.
        - generic [ref=e34]:
          - heading "Real-time collaboration" [level=3] [ref=e35]
          - paragraph [ref=e36]: Work together in a shared interview room.
        - generic [ref=e42]:
          - heading "Structured evaluations" [level=3] [ref=e43]
          - paragraph [ref=e44]: Track performance with interview scorecards.
    - paragraph [ref=e45]: © 2026 CodeCollab. Built for better technical interviews.
  - generic [ref=e47]:
    - generic [ref=e48]:
      - heading "Welcome back" [level=2] [ref=e49]
      - paragraph [ref=e50]: Sign in to continue to your CodeCollab workspace.
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e53]: Email address
        - textbox "Email address" [ref=e58]:
          - /placeholder: you@example.com
      - generic [ref=e59]:
        - generic [ref=e60]: Password
        - generic [ref=e62]:
          - textbox "Password" [ref=e66]:
            - /placeholder: Enter your password
          - button "Show password" [ref=e67]
      - button "Sign in" [ref=e71]
    - generic [ref=e74]: NEW TO CODECOLLAB?
    - paragraph [ref=e78]:
      - text: Don't have an account?
      - link "Create account" [ref=e79] [cursor=pointer]:
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
  45 |     await expect(page.getByRole("button", { name: /create|schedule|submit/i }).first()).toBeVisible();
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
> 74 |     await titleField.fill("Test Interview");
     |                      ^ TimeoutError: locator.fill: Timeout 10000ms exceeded.
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