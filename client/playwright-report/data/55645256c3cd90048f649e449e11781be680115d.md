# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-interview-dashboard.spec.js >> Interview Dashboard >> candidate dashboard shows upcoming interviews
- Location: tests\e2e\05-interview-dashboard.spec.js:36:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Frontend Engineer Interview')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Frontend Engineer Interview') with timeout 10000ms
  - waiting for getByText('Frontend Engineer Interview')

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
  4  | const MOCK_INTERVIEWS_DATA = [
  5  |   {
  6  |     _id: "intv-001",
  7  |     title: "Frontend Engineer Interview",
  8  |     status: "scheduled",
  9  |     roomCode: "CC-A1B2C3D4",
  10 |     scheduledAt: "2025-01-15T10:00:00Z",
  11 |     duration: 60,
  12 |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  13 |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  14 |     problems: [],
  15 |   },
  16 |   {
  17 |     _id: "intv-002",
  18 |     title: "Backend Systems Interview",
  19 |     status: "completed",
  20 |     roomCode: "CC-B2C3D4E5",
  21 |     scheduledAt: "2025-01-10T14:00:00Z",
  22 |     duration: 90,
  23 |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  24 |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  25 |     problems: [],
  26 |   },
  27 | ];
  28 | 
  29 | const MOCK_RESPONSE = {
  30 |   success: true,
  31 |   data: MOCK_INTERVIEWS_DATA,
  32 |   pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
  33 | };
  34 | 
  35 | test.describe("Interview Dashboard", () => {
  36 |   test("candidate dashboard shows upcoming interviews", async ({ page }) => {
  37 |     await mockAuthMe(page, "candidate");
  38 |     await loginAs(page, "candidate");
  39 |     await page.route("**/api/interviews/my**", (r) =>
  40 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
  41 |     );
  42 |     await page.goto("/interviews");
> 43 |     await expect(page.getByText("Frontend Engineer Interview")).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  44 |     await expect(page.getByText("Backend Systems Interview")).toBeVisible();
  45 |   });
  46 | 
  47 |   test("interview cards show status badges", async ({ page }) => {
  48 |     await mockAuthMe(page, "candidate");
  49 |     await loginAs(page, "candidate");
  50 |     await page.route("**/api/interviews/my**", (r) =>
  51 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
  52 |     );
  53 |     await page.goto("/interviews");
  54 |     await expect(page.getByText(/scheduled/i).first()).toBeVisible();
  55 |     await expect(page.getByText(/completed/i).first()).toBeVisible();
  56 |   });
  57 | 
  58 |   test("candidate sees Join Interview button/link", async ({ page }) => {
  59 |     await mockAuthMe(page, "candidate");
  60 |     await loginAs(page, "candidate");
  61 |     await page.route("**/api/interviews/my**", (r) =>
  62 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
  63 |     );
  64 |     await page.goto("/interviews");
  65 |     await expect(page.getByRole("link", { name: /join interview/i }).or(page.getByRole("button", { name: /join/i })).first()).toBeVisible();
  66 |   });
  67 | 
  68 |   test("interviewer sees Create Interview button/link", async ({ page }) => {
  69 |     await mockAuthMe(page, "interviewer");
  70 |     await loginAs(page, "interviewer");
  71 |     await page.route("**/api/interviews/my**", (r) =>
  72 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
  73 |     );
  74 |     await page.goto("/interviews");
  75 |     await expect(page.getByRole("link", { name: /create interview/i }).or(page.getByRole("button", { name: /create/i })).first()).toBeVisible();
  76 |   });
  77 | 
  78 |   test("interview list shows empty state when no interviews", async ({ page }) => {
  79 |     await mockAuthMe(page, "candidate");
  80 |     await loginAs(page, "candidate");
  81 |     await page.route("**/api/interviews/my**", (r) =>
  82 |       r.fulfill({
  83 |         status: 200,
  84 |         contentType: "application/json",
  85 |         body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
  86 |       })
  87 |     );
  88 |     await page.goto("/interviews");
  89 |     await expect(page.getByText(/no interviews|schedule|upcoming/i).first()).toBeVisible();
  90 |   });
  91 | });
  92 | 
```