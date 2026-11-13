# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-interview-details.spec.js >> Interview Details >> interview detail shows duration
- Location: tests\e2e\08-interview-details.spec.js:90:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/60|1 hour/i).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/60|1 hour/i).first() with timeout 10000ms
  - waiting for getByText(/60|1 hour/i).first()

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
  7   |     _id: "intv-001",
  8   |     title: "Frontend Engineer Interview",
  9   |     status: "scheduled",
  10  |     roomCode: "CC-A1B2C3D4",
  11  |     scheduledAt: "2025-01-15T10:00:00Z",
  12  |     duration: 60,
  13  |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  14  |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  15  |     problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  16  |   },
  17  | };
  18  | 
  19  | const MOCK_COMPLETED_INTERVIEW = {
  20  |   success: true,
  21  |   data: {
  22  |     ...MOCK_INTERVIEW.data,
  23  |     _id: "intv-002",
  24  |     status: "completed",
  25  |     roomCode: "CC-B2C3D4E5",
  26  |   },
  27  | };
  28  | 
  29  | test.describe("Interview Details", () => {
  30  |   test("interview details page renders title", async ({ page }) => {
  31  |     await mockAuthMe(page, "interviewer");
  32  |     await loginAs(page, "interviewer");
  33  |     await page.route("**/api/interviews/intv-001", (r) =>
  34  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  35  |     );
  36  |     await page.goto("/interviews/intv-001");
  37  |     await expect(page.getByText("Frontend Engineer Interview")).toBeVisible();
  38  |   });
  39  | 
  40  |   test("interview details page renders status badge", async ({ page }) => {
  41  |     await mockAuthMe(page, "interviewer");
  42  |     await loginAs(page, "interviewer");
  43  |     await page.route("**/api/interviews/intv-001", (r) =>
  44  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  45  |     );
  46  |     await page.goto("/interviews/intv-001");
  47  |     await expect(page.getByText(/scheduled/i).first()).toBeVisible();
  48  |   });
  49  | 
  50  |   test("interview details page renders room code", async ({ page }) => {
  51  |     await mockAuthMe(page, "interviewer");
  52  |     await loginAs(page, "interviewer");
  53  |     await page.route("**/api/interviews/intv-001", (r) =>
  54  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  55  |     );
  56  |     await page.goto("/interviews/intv-001");
  57  |     await expect(page.getByText(/CC-A1B2C3D4/i)).toBeVisible();
  58  |   });
  59  | 
  60  |   test("interview details page renders interviewer name", async ({ page }) => {
  61  |     await mockAuthMe(page, "interviewer");
  62  |     await loginAs(page, "interviewer");
  63  |     await page.route("**/api/interviews/intv-001", (r) =>
  64  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  65  |     );
  66  |     await page.goto("/interviews/intv-001");
  67  |     await expect(page.getByText("Bob Interviewer")).toBeVisible();
  68  |   });
  69  | 
  70  |   test("interview details page renders candidate name", async ({ page }) => {
  71  |     await mockAuthMe(page, "candidate");
  72  |     await loginAs(page, "candidate");
  73  |     await page.route("**/api/interviews/intv-001", (r) =>
  74  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  75  |     );
  76  |     await page.goto("/interviews/intv-001");
  77  |     await expect(page.getByText("Alice Candidate")).toBeVisible();
  78  |   });
  79  | 
  80  |   test("completed interview shows replay link", async ({ page }) => {
  81  |     await mockAuthMe(page, "interviewer");
  82  |     await loginAs(page, "interviewer");
  83  |     await page.route("**/api/interviews/intv-002", (r) =>
  84  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_COMPLETED_INTERVIEW) })
  85  |     );
  86  |     await page.goto("/interviews/intv-002");
  87  |     await expect(page.getByRole("link", { name: /replay/i }).or(page.getByText(/replay/i)).first()).toBeVisible();
  88  |   });
  89  | 
  90  |   test("interview detail shows duration", async ({ page }) => {
  91  |     await mockAuthMe(page, "interviewer");
  92  |     await loginAs(page, "interviewer");
  93  |     await page.route("**/api/interviews/intv-001", (r) =>
  94  |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  95  |     );
  96  |     await page.goto("/interviews/intv-001");
> 97  |     await expect(page.getByText(/60|1 hour/i).first()).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  98  |   });
  99  | });
  100 | 
```