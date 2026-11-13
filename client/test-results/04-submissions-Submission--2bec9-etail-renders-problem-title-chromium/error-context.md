# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-submissions.spec.js >> Submission History & Detail >> submission detail renders problem title
- Location: tests\e2e\04-submissions.spec.js:92:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Two Sum')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Two Sum') with timeout 10000ms
  - waiting for getByText('Two Sum')

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
  4   | const MOCK_SUBMISSIONS = {
  5   |   success: true,
  6   |   data: {
  7   |     submissions: [
  8   |       {
  9   |         _id: "sub-001",
  10  |         problem: { _id: "prob-001", title: "Two Sum" },
  11  |         language: "javascript",
  12  |         status: "Accepted",
  13  |         executionTime: 42,
  14  |         memoryUsed: 38,
  15  |         submittedAt: "2024-06-01T10:00:00Z",
  16  |         passedTestCases: 10,
  17  |         totalTestCases: 10,
  18  |       },
  19  |       {
  20  |         _id: "sub-002",
  21  |         problem: { _id: "prob-002", title: "Longest Substring" },
  22  |         language: "python",
  23  |         status: "Wrong Answer",
  24  |         executionTime: 120,
  25  |         memoryUsed: 44,
  26  |         submittedAt: "2024-06-02T11:00:00Z",
  27  |         passedTestCases: 7,
  28  |         totalTestCases: 10,
  29  |       },
  30  |     ],
  31  |     pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  32  |   },
  33  | };
  34  | 
  35  | const MOCK_SUB_DETAIL = {
  36  |   success: true,
  37  |   data: {
  38  |     _id: "sub-001",
  39  |     problem: { _id: "prob-001", title: "Two Sum" },
  40  |     language: "javascript",
  41  |     status: "Accepted",
  42  |     code: "function twoSum(nums, target) { return [0,1]; }",
  43  |     executionTime: 42,
  44  |     memoryUsed: 38,
  45  |     submittedAt: "2024-06-01T10:00:00Z",
  46  |     passedTestCases: 10,
  47  |     totalTestCases: 10,
  48  |   },
  49  | };
  50  | 
  51  | test.describe("Submission History & Detail", () => {
  52  |   test.beforeEach(async ({ page }) => {
  53  |     await mockAuthMe(page, "candidate");
  54  |     await loginAs(page, "candidate");
  55  |   });
  56  | 
  57  |   test("submission history page renders submission rows", async ({ page }) => {
  58  |     await page.route("**/api/submissions/my**", (r) =>
  59  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
  60  |     );
  61  |     await page.goto("/submissions");
  62  |     await expect(page.getByText("Two Sum")).toBeVisible();
  63  |     await expect(page.getByText("Longest Substring")).toBeVisible();
  64  |   });
  65  | 
  66  |   test("submission history page shows status badges", async ({ page }) => {
  67  |     await page.route("**/api/submissions/my**", (r) =>
  68  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
  69  |     );
  70  |     await page.goto("/submissions");
  71  |     await expect(page.getByText("Accepted").first()).toBeVisible();
  72  |     await expect(page.getByText("Wrong Answer").first()).toBeVisible();
  73  |   });
  74  | 
  75  |   test("submission history page has language labels", async ({ page }) => {
  76  |     await page.route("**/api/submissions/my**", (r) =>
  77  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
  78  |     );
  79  |     await page.goto("/submissions");
  80  |     await expect(page.getByText(/javascript/i).first()).toBeVisible();
  81  |   });
  82  | 
  83  |   test("submission detail renders status and language", async ({ page }) => {
  84  |     await page.route("**/api/submissions/sub-001", (r) =>
  85  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
  86  |     );
  87  |     await page.goto("/submissions/sub-001");
  88  |     await expect(page.getByText("Accepted").first()).toBeVisible();
  89  |     await expect(page.getByText(/javascript/i).first()).toBeVisible();
  90  |   });
  91  | 
  92  |   test("submission detail renders problem title", async ({ page }) => {
  93  |     await page.route("**/api/submissions/sub-001", (r) =>
  94  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
  95  |     );
  96  |     await page.goto("/submissions/sub-001");
> 97  |     await expect(page.getByText("Two Sum")).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  98  |   });
  99  | 
  100 |   test("submission detail shows code", async ({ page }) => {
  101 |     await page.route("**/api/submissions/sub-001", (r) =>
  102 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
  103 |     );
  104 |     await page.goto("/submissions/sub-001");
  105 |     await expect(page.getByText(/twoSum|function/i)).toBeVisible();
  106 |   });
  107 | });
  108 | 
```