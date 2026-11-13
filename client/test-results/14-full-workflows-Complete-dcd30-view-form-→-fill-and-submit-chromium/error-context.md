# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 14-full-workflows.spec.js >> Complete E2E User Workflows >> Workflow 2 — Interviewer: dashboard → create interview form → fill and submit
- Location: tests\e2e\14-full-workflows.spec.js:69:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/title/i).or(getByPlaceholder(/title/i)).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByLabel(/title/i).or(getByPlaceholder(/title/i)).first() with timeout 10000ms
  - waiting for getByLabel(/title/i).or(getByPlaceholder(/title/i)).first()

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
  4   | const MOCK_PROBLEMS_LIST = {
  5   |   success: true,
  6   |   data: [
  7   |     { _id: "prob-001", title: "Two Sum", difficulty: "Easy", category: "Arrays", tags: [], isPublished: true },
  8   |     { _id: "prob-002", title: "Merge Intervals", difficulty: "Medium", category: "Arrays", tags: [], isPublished: true },
  9   |   ],
  10  |   pagination: { page: 1, limit: 9, total: 2, totalPages: 1 },
  11  | };
  12  | 
  13  | const MOCK_PROBLEM_DETAIL = {
  14  |   success: true,
  15  |   data: {
  16  |     _id: "prob-001",
  17  |     title: "Two Sum",
  18  |     description: "Given an array of integers nums and an integer target, return indices.",
  19  |     difficulty: "Easy",
  20  |     category: "Arrays",
  21  |     supportedLanguages: ["javascript", "python"],
  22  |     timeLimit: 1000,
  23  |     memoryLimit: 256,
  24  |     starterCode: { javascript: "function twoSum(nums, target) {}", python: "def twoSum(): pass" },
  25  |     examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "" }],
  26  |     constraints: "2 <= n <= 10^4",
  27  |     tags: [],
  28  |     isPublished: true,
  29  |   },
  30  | };
  31  | 
  32  | const MOCK_INTERVIEWS_EMPTY = {
  33  |   success: true,
  34  |   data: [],
  35  |   pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  36  | };
  37  | 
  38  | test.describe("Complete E2E User Workflows", () => {
  39  |   test("Workflow 1 — Candidate: dashboard → problems → problem detail → editor loads", async ({ page }) => {
  40  |     await mockAuthMe(page, "candidate");
  41  |     await loginAs(page, "candidate");
  42  |     await page.route("**/api/interviews/my**", (r) =>
  43  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
  44  |     );
  45  |     await page.route("**/api/problems/prob-001**", (r) =>
  46  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM_DETAIL) })
  47  |     );
  48  |     await page.route("**/api/problems**", (r) =>
  49  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS_LIST) })
  50  |     );
  51  | 
  52  |     // Step 1: Land on dashboard
  53  |     await page.goto("/dashboard");
  54  |     await expect(page).not.toHaveURL(/.*login/);
  55  | 
  56  |     // Step 2: Navigate to problems
  57  |     await page.goto("/problems");
  58  |     await expect(page.getByText("Two Sum")).toBeVisible();
  59  | 
  60  |     // Step 3: Click on problem
  61  |     await page.getByText("Two Sum").first().click();
  62  |     await expect(page).toHaveURL(/\/problems\/prob-001/);
  63  | 
  64  |     // Step 4: Verify editor loads
  65  |     const editor = page.locator(".monaco-editor, [data-keybinding-context]");
  66  |     await expect(editor.first()).toBeVisible({ timeout: 15000 });
  67  |   });
  68  | 
  69  |   test("Workflow 2 — Interviewer: dashboard → create interview form → fill and submit", async ({ page }) => {
  70  |     await mockAuthMe(page, "interviewer");
  71  |     await loginAs(page, "interviewer");
  72  |     await page.route("**/api/interviews/my**", (r) =>
  73  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
  74  |     );
  75  |     await page.route("**/api/problems**", (r) =>
  76  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS_LIST) })
  77  |     );
  78  |     await page.route("**/api/interviews", (r) => {
  79  |       if (r.request().method() === "POST") {
  80  |         r.fulfill({
  81  |           status: 201,
  82  |           contentType: "application/json",
  83  |           body: JSON.stringify({ success: true, data: { _id: "intv-new", title: "My Test Interview", status: "scheduled", roomCode: "CC-AABBCCDD" } }),
  84  |         });
  85  |       } else {
  86  |         r.continue();
  87  |       }
  88  |     });
  89  | 
  90  |     // Step 1: Dashboard
  91  |     await page.goto("/dashboard");
  92  |     await expect(page).not.toHaveURL(/.*login/);
  93  | 
  94  |     // Step 2: Navigate to create interview
  95  |     await page.goto("/interviews/create");
  96  |     await expect(page).not.toHaveURL(/.*unauthorized/);
  97  | 
  98  |     // Step 3: Fill form
  99  |     const titleField = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first();
> 100 |     await expect(titleField).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  101 |     await titleField.fill("My Test Interview");
  102 | 
  103 |     const durationField = page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first();
  104 |     if (await durationField.isVisible()) {
  105 |       await durationField.fill("60");
  106 |     }
  107 | 
  108 |     // Step 4: Submit
  109 |     await page.getByRole("button", { name: /create|schedule|submit/i }).first().click();
  110 | 
  111 |     // Should navigate away from the create form after success
  112 |     await page.waitForURL(/\/interviews/, { timeout: 10000 });
  113 |   });
  114 | 
  115 |   test("Workflow 3 — Candidate: join interview flow with valid code", async ({ page }) => {
  116 |     await mockAuthMe(page, "candidate");
  117 |     await loginAs(page, "candidate");
  118 |     await page.route("**/api/interviews/join", (r) =>
  119 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { _id: "intv-001" } }) })
  120 |     );
  121 |     await page.route("**/api/interviews/my**", (r) =>
  122 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
  123 |     );
  124 | 
  125 |     // Step 1: Navigate to join page
  126 |     await page.goto("/interviews/join");
  127 |     await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();
  128 | 
  129 |     // Step 2: Type invalid code — verify error
  130 |     const input = page.getByPlaceholder(/CC-|room code|invitation/i);
  131 |     await input.fill("INVALIDCODE");
  132 |     await page.getByRole("button", { name: /join/i }).first().click();
  133 |     await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();
  134 | 
  135 |     // Step 3: Type valid code — verify API called
  136 |     await input.fill("CC-A1B2C3D4");
  137 |     await page.getByRole("button", { name: /join/i }).first().click();
  138 |     await page.waitForTimeout(1000);
  139 |     // After API success, should redirect away
  140 |     await expect(page).not.toHaveURL(/.*unauthorized/);
  141 |   });
  142 | 
  143 |   test("Workflow 4 — Admin: access admin dashboard and view stats", async ({ page }) => {
  144 |     await mockAuthMe(page, "admin");
  145 |     await loginAs(page, "admin");
  146 |     await page.route("**/api/admin/stats**", (r) =>
  147 |       r.fulfill({
  148 |         status: 200,
  149 |         contentType: "application/json",
  150 |         body: JSON.stringify({
  151 |           success: true,
  152 |           data: {
  153 |             users: { total: 42, candidates: 30, interviewers: 11, admins: 1 },
  154 |             problems: { total: 15, published: 12, unpublished: 3, easy: 5, medium: 7, hard: 3 },
  155 |             interviews: { total: 20, scheduled: 5, waiting: 2, active: 1, completed: 10, cancelled: 2 },
  156 |             submissions: { total: 150, accepted: 90, failed: 60, passRate: 60 },
  157 |             evaluations: { total: 10, averageOverallScore: 72, recommendations: { strong_hire: 2, hire: 5, hold: 2, no_hire: 1 } },
  158 |             recentActivity: { interviews: [], submissions: [], users: [] },
  159 |           },
  160 |         }),
  161 |       })
  162 |     );
  163 |     await page.route("**/api/**", (r) =>
  164 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
  165 |     );
  166 | 
  167 |     // Step 1: Go to admin dashboard
  168 |     await page.goto("/admin");
  169 |     await expect(page.getByText(/Admin Control Center/i)).toBeVisible({ timeout: 10000 });
  170 | 
  171 |     // Step 2: Verify stat cards
  172 |     await expect(page.getByText("Total Users")).toBeVisible();
  173 |     await expect(page.getByText("42")).toBeVisible();
  174 |   });
  175 | 
  176 |   test("Workflow 5 — Unauthenticated: all protected routes redirect to login", async ({ page }) => {
  177 |     const protectedRoutes = ["/dashboard", "/problems", "/interviews", "/submissions", "/notifications"];
  178 |     for (const route of protectedRoutes) {
  179 |       await page.goto(route);
  180 |       await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  181 |     }
  182 |   });
  183 | });
  184 | 
```