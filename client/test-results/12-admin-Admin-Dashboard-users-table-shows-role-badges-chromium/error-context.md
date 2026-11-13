# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-admin.spec.js >> Admin Dashboard >> users table shows role badges
- Location: tests\e2e\12-admin.spec.js:109:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Users/i })

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
  81  |     await expect(page.getByText(/Coding Problems/i)).toBeVisible({ timeout: 10000 });
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
> 111 |     await page.getByRole("button", { name: /Users/i }).click();
      |                                                        ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
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