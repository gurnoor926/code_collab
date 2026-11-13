# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-admin.spec.js >> Admin Dashboard >> admin dashboard overview tab shows Coding Problems stat card
- Location: tests\e2e\12-admin.spec.js:79:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Coding Problems/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Coding Problems/i) with timeout 10000ms
  - waiting for getByText(/Coding Problems/i)

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
  1   | import { test, expect } from "@playwright/test";
  2   | import { loginAs, mockAuthMe } from "./helpers/auth.js";
  3   | 
  4   | const MOCK_STATS = {
  5   |   success: true,
  6   |   data: {
  7   |     users: { total: 42, candidates: 30, interviewers: 11, admins: 1 },
  8   |     problems: { total: 15, published: 12, unpublished: 3, easy: 5, medium: 7, hard: 3 },
  9   |     interviews: { total: 20, scheduled: 5, waiting: 2, active: 1, completed: 10, cancelled: 2 },
  10  |     submissions: { total: 150, accepted: 90, failed: 60, passRate: 60 },
  11  |     evaluations: { total: 10, averageOverallScore: 72, recommendations: { strong_hire: 2, hire: 5, hold: 2, no_hire: 1 } },
  12  |     recentActivity: { interviews: [], submissions: [], users: [] },
  13  |   },
  14  | };
  15  | 
  16  | const MOCK_USERS = {
  17  |   success: true,
  18  |   data: [
  19  |     { _id: "u1", name: "Alice Candidate", email: "alice@test.com", role: "candidate", createdAt: "2024-01-01T00:00:00Z" },
  20  |     { _id: "u2", name: "Bob Interviewer", email: "bob@test.com", role: "interviewer", createdAt: "2024-01-02T00:00:00Z" },
  21  |   ],
  22  |   pagination: { page: 1, limit: 15, total: 2, totalPages: 1 },
  23  | };
  24  | 
  25  | const MOCK_INTERVIEWS_LIST = {
  26  |   success: true,
  27  |   data: [
  28  |     { _id: "intv-001", title: "Frontend Interview", status: "scheduled", roomCode: "CC-A1B2C3D4", interviewer: { name: "Bob" }, candidate: { name: "Alice" }, scheduledAt: "2025-01-15T10:00:00Z" },
  29  |   ],
  30  |   pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
  31  | };
  32  | 
  33  | const MOCK_PROBLEMS = {
  34  |   success: true,
  35  |   data: [
  36  |     { _id: "prob-001", title: "Two Sum", difficulty: "Easy", category: "Arrays", isPublished: true, tags: [] },
  37  |   ],
  38  |   pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  39  | };
  40  | 
  41  | test.describe("Admin Dashboard", () => {
  42  |   test.beforeEach(async ({ page }) => {
  43  |     await mockAuthMe(page, "admin");
  44  |     await loginAs(page, "admin");
  45  |     // Mock all admin service fallback APIs
  46  |     await page.route("**/api/admin/stats**", (r) =>
  47  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_STATS) })
  48  |     );
  49  |     await page.route("**/api/admin/users**", (r) =>
  50  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_USERS) })
  51  |     );
  52  |     await page.route("**/api/admin/interviews**", (r) =>
  53  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_LIST) })
  54  |     );
  55  |     await page.route("**/api/problems**", (r) =>
  56  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS) })
  57  |     );
  58  |     await page.route("**/api/interviews/my**", (r) =>
  59  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_LIST) })
  60  |     );
  61  |     await page.route("**/api/submissions/my**", (r) =>
  62  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { submissions: [], pagination: { total: 0 } } }) })
  63  |     );
  64  |     await page.route("**/api/evaluations/dashboard**", (r) =>
  65  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: {} }) })
  66  |     );
  67  |   });
  68  | 
  69  |   test("admin dashboard renders Admin Control Center heading", async ({ page }) => {
  70  |     await page.goto("/admin");
  71  |     await expect(page.getByText(/Admin Control Center/i)).toBeVisible({ timeout: 10000 });
  72  |   });
  73  | 
  74  |   test("admin dashboard overview tab shows Total Users stat card", async ({ page }) => {
  75  |     await page.goto("/admin");
  76  |     await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 10000 });
  77  |   });
  78  | 
  79  |   test("admin dashboard overview tab shows Coding Problems stat card", async ({ page }) => {
  80  |     await page.goto("/admin");
> 81  |     await expect(page.getByText(/Coding Problems/i)).toBeVisible({ timeout: 10000 });
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  82  |   });
  83  | 
  84  |   test("admin dashboard overview tab shows Interview Sessions stat card", async ({ page }) => {
  85  |     await page.goto("/admin");
  86  |     await expect(page.getByText(/Interview Sessions/i)).toBeVisible({ timeout: 10000 });
  87  |   });
  88  | 
  89  |   test("admin dashboard overview tab shows Total Submissions stat card", async ({ page }) => {
  90  |     await page.goto("/admin");
  91  |     await expect(page.getByText(/Total Submissions/i)).toBeVisible({ timeout: 10000 });
  92  |   });
  93  | 
  94  |   test("admin dashboard has tab buttons", async ({ page }) => {
  95  |     await page.goto("/admin");
  96  |     await expect(page.getByRole("button", { name: /Overview/i })).toBeVisible({ timeout: 10000 });
  97  |     await expect(page.getByRole("button", { name: /Problem Bank/i })).toBeVisible({ timeout: 10000 });
  98  |     await expect(page.getByRole("button", { name: /Interviews/i })).toBeVisible({ timeout: 10000 });
  99  |     await expect(page.getByRole("button", { name: /Users/i })).toBeVisible({ timeout: 10000 });
  100 |   });
  101 | 
  102 |   test("clicking Users tab renders user table", async ({ page }) => {
  103 |     await page.goto("/admin");
  104 |     await page.getByRole("button", { name: /Users/i }).click();
  105 |     await expect(page.getByText("Alice Candidate")).toBeVisible({ timeout: 10000 });
  106 |     await expect(page.getByText("Bob Interviewer")).toBeVisible({ timeout: 10000 });
  107 |   });
  108 | 
  109 |   test("users table shows role badges", async ({ page }) => {
  110 |     await page.goto("/admin");
  111 |     await page.getByRole("button", { name: /Users/i }).click();
  112 |     await expect(page.getByText(/candidate/i).first()).toBeVisible({ timeout: 10000 });
  113 |     await expect(page.getByText(/interviewer/i).first()).toBeVisible({ timeout: 10000 });
  114 |   });
  115 | 
  116 |   test("clicking Interviews tab renders interview table", async ({ page }) => {
  117 |     await page.goto("/admin");
  118 |     await page.getByRole("button", { name: /Interviews/i }).click();
  119 |     await expect(page.getByText("Frontend Interview")).toBeVisible({ timeout: 10000 });
  120 |   });
  121 | 
  122 |   test("interviews table shows status badge", async ({ page }) => {
  123 |     await page.goto("/admin");
  124 |     await page.getByRole("button", { name: /Interviews/i }).click();
  125 |     await expect(page.getByText(/scheduled/i).first()).toBeVisible({ timeout: 10000 });
  126 |   });
  127 | 
  128 |   test("clicking Problem Bank tab renders problem table", async ({ page }) => {
  129 |     await page.goto("/admin");
  130 |     await page.getByRole("button", { name: /Problem Bank/i }).click();
  131 |     await expect(page.getByText("Two Sum")).toBeVisible({ timeout: 10000 });
  132 |   });
  133 | 
  134 |   test("admin stat numbers render correctly from mocked data", async ({ page }) => {
  135 |     await page.goto("/admin");
  136 |     await expect(page.getByText("42")).toBeVisible({ timeout: 10000 }); // Total users
  137 |     await expect(page.getByText("15")).toBeVisible({ timeout: 10000 }); // Total problems
  138 |   });
  139 | });
  140 | 
```