# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-evaluation.spec.js >> Evaluation & Scorecard >> evaluation page renders candidate name
- Location: tests\e2e\13-evaluation.spec.js:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Alice Candidate')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Alice Candidate') with timeout 10000ms
  - waiting for getByText('Alice Candidate')

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
  4   | const MOCK_INTERVIEW = {
  5   |   success: true,
  6   |   data: {
  7   |     _id: "intv-002",
  8   |     title: "Backend Systems Interview",
  9   |     status: "completed",
  10  |     roomCode: "CC-B2C3D4E5",
  11  |     scheduledAt: "2025-01-10T14:00:00Z",
  12  |     duration: 90,
  13  |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  14  |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  15  |     problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  16  |   },
  17  | };
  18  | 
  19  | const MOCK_EVALUATION = {
  20  |   success: true,
  21  |   data: {
  22  |     _id: "eval-001",
  23  |     interview: "intv-002",
  24  |     candidate: { _id: "user-cand-001", name: "Alice Candidate" },
  25  |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer" },
  26  |     scores: { technicalSkills: 80, problemSolving: 75, communication: 85, codeQuality: 78 },
  27  |     overallScore: 80,
  28  |     recommendation: "hire",
  29  |     notes: "Strong candidate with good problem-solving skills.",
  30  |     status: "submitted",
  31  |     createdAt: "2025-01-10T16:00:00Z",
  32  |   },
  33  | };
  34  | 
  35  | test.describe("Evaluation & Scorecard", () => {
  36  |   test("interviewer can access evaluation page for completed interview", async ({ page }) => {
  37  |     await mockAuthMe(page, "interviewer");
  38  |     await loginAs(page, "interviewer");
  39  |     await page.route("**/api/interviews/intv-002**", (r) =>
  40  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  41  |     );
  42  |     await page.route("**/api/evaluations/**", (r) =>
  43  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
  44  |     );
  45  |     await page.goto("/interviews/intv-002/evaluation");
  46  |     await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  47  |   });
  48  | 
  49  |   test("evaluation page renders candidate name", async ({ page }) => {
  50  |     await mockAuthMe(page, "interviewer");
  51  |     await loginAs(page, "interviewer");
  52  |     await page.route("**/api/interviews/intv-002**", (r) =>
  53  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  54  |     );
  55  |     await page.route("**/api/evaluations/**", (r) =>
  56  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
  57  |     );
  58  |     await page.goto("/interviews/intv-002/evaluation");
> 59  |     await expect(page.getByText("Alice Candidate")).toBeVisible({ timeout: 10000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  60  |   });
  61  | 
  62  |   test("evaluation page renders score/rating fields", async ({ page }) => {
  63  |     await mockAuthMe(page, "interviewer");
  64  |     await loginAs(page, "interviewer");
  65  |     await page.route("**/api/interviews/intv-002**", (r) =>
  66  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  67  |     );
  68  |     await page.route("**/api/evaluations/**", (r) =>
  69  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) })
  70  |     );
  71  |     await page.goto("/interviews/intv-002/evaluation");
  72  |     await expect(
  73  |       page.getByText(/technical|problem solving|communication|code quality/i).first()
  74  |     ).toBeVisible({ timeout: 10000 });
  75  |   });
  76  | 
  77  |   test("evaluation page renders recommendation selector", async ({ page }) => {
  78  |     await mockAuthMe(page, "interviewer");
  79  |     await loginAs(page, "interviewer");
  80  |     await page.route("**/api/interviews/intv-002**", (r) =>
  81  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  82  |     );
  83  |     await page.route("**/api/evaluations/**", (r) =>
  84  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) })
  85  |     );
  86  |     await page.goto("/interviews/intv-002/evaluation");
  87  |     await expect(
  88  |       page.getByText(/strong hire|hire|hold|no hire/i).first().or(page.getByRole("combobox").first())
  89  |     ).toBeVisible({ timeout: 10000 });
  90  |   });
  91  | 
  92  |   test("candidate scorecard page renders overall score", async ({ page }) => {
  93  |     await mockAuthMe(page, "candidate");
  94  |     await loginAs(page, "candidate");
  95  |     await page.route("**/api/interviews/intv-002**", (r) =>
  96  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  97  |     );
  98  |     await page.route("**/api/evaluations/**", (r) =>
  99  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
  100 |     );
  101 |     await page.goto("/interviews/intv-002/scorecard");
  102 |     await expect(page.getByText(/scorecard|score|evaluation/i).first()).toBeVisible({ timeout: 10000 });
  103 |   });
  104 | 
  105 |   test("candidate scorecard shows recommendation", async ({ page }) => {
  106 |     await mockAuthMe(page, "candidate");
  107 |     await loginAs(page, "candidate");
  108 |     await page.route("**/api/interviews/intv-002**", (r) =>
  109 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  110 |     );
  111 |     await page.route("**/api/evaluations/**", (r) =>
  112 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
  113 |     );
  114 |     await page.goto("/interviews/intv-002/scorecard");
  115 |     await expect(page.getByText(/hire|strong hire/i).first()).toBeVisible({ timeout: 10000 });
  116 |   });
  117 | 
  118 |   test("candidate cannot access interviewer evaluation page", async ({ page }) => {
  119 |     await mockAuthMe(page, "candidate");
  120 |     await loginAs(page, "candidate");
  121 |     await page.goto("/interviews/intv-002/evaluation");
  122 |     await expect(page).toHaveURL(/.*unauthorized|.*login/);
  123 |   });
  124 | });
  125 | 
```