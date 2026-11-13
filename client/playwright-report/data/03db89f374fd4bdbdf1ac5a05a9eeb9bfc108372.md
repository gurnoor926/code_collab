# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 10-replay.spec.js >> Interview Replay >> replay page renders interview title or header
- Location: tests\e2e\10-replay.spec.js:68:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Backend Systems Interview|replay/i).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Backend Systems Interview|replay/i).first() with timeout 10000ms
  - waiting for getByText(/Backend Systems Interview|replay/i).first()

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
  4  | const MOCK_INTERVIEW = {
  5  |   success: true,
  6  |   data: {
  7  |     _id: "intv-002",
  8  |     title: "Backend Systems Interview",
  9  |     status: "completed",
  10 |     roomCode: "CC-B2C3D4E5",
  11 |     scheduledAt: "2025-01-10T14:00:00Z",
  12 |     duration: 90,
  13 |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  14 |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  15 |     problems: [],
  16 |   },
  17 | };
  18 | 
  19 | const MOCK_REPLAY_EVENTS = {
  20 |   success: true,
  21 |   data: [
  22 |     { _id: "evt-001", eventType: "code_change", payload: { code: "function hello() {}" }, timestamp: "2025-01-10T14:01:00Z", elapsedMs: 60000 },
  23 |     { _id: "evt-002", eventType: "language_change", payload: { language: "python" }, timestamp: "2025-01-10T14:05:00Z", elapsedMs: 300000 },
  24 |     { _id: "evt-003", eventType: "code_run", payload: { status: "Accepted" }, timestamp: "2025-01-10T14:30:00Z", elapsedMs: 1800000 },
  25 |   ],
  26 | };
  27 | 
  28 | test.describe("Interview Replay", () => {
  29 |   test.beforeEach(async ({ page }) => {
  30 |     await mockAuthMe(page, "interviewer");
  31 |     await loginAs(page, "interviewer");
  32 |     await page.route("**/api/interviews/intv-002", (r) =>
  33 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  34 |     );
  35 |     await page.route("**/api/replays/intv-002/events**", (r) =>
  36 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REPLAY_EVENTS) })
  37 |     );
  38 |     await page.route("**/api/replays/**", (r) =>
  39 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REPLAY_EVENTS) })
  40 |     );
  41 |   });
  42 | 
  43 |   test("replay page loads without crashing", async ({ page }) => {
  44 |     await page.goto("/interviews/intv-002/replay");
  45 |     await expect(page.locator("body")).toBeVisible();
  46 |     await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  47 |   });
  48 | 
  49 |   test("replay page renders play/pause control", async ({ page }) => {
  50 |     await page.goto("/interviews/intv-002/replay");
  51 |     await expect(
  52 |       page.getByRole("button", { name: /play|pause/i }).first()
  53 |     ).toBeVisible({ timeout: 10000 });
  54 |   });
  55 | 
  56 |   test("replay page renders speed controls", async ({ page }) => {
  57 |     await page.goto("/interviews/intv-002/replay");
  58 |     await expect(page.getByText(/1x|speed|0\.5x|2x/i).first()).toBeVisible({ timeout: 10000 });
  59 |   });
  60 | 
  61 |   test("replay page renders event list items", async ({ page }) => {
  62 |     await page.goto("/interviews/intv-002/replay");
  63 |     await expect(
  64 |       page.getByText(/code_change|language_change|code_run|event/i).first()
  65 |     ).toBeVisible({ timeout: 10000 });
  66 |   });
  67 | 
  68 |   test("replay page renders interview title or header", async ({ page }) => {
  69 |     await page.goto("/interviews/intv-002/replay");
  70 |     await expect(
  71 |       page.getByText(/Backend Systems Interview|replay/i).first()
> 72 |     ).toBeVisible({ timeout: 10000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  73 |   });
  74 | 
  75 |   test("play button is clickable", async ({ page }) => {
  76 |     await page.goto("/interviews/intv-002/replay");
  77 |     const playBtn = page.getByRole("button", { name: /play|pause/i }).first();
  78 |     await expect(playBtn).toBeVisible({ timeout: 10000 });
  79 |     await playBtn.click();
  80 |     // Should not crash — just verify page is still visible
  81 |     await expect(page.locator("body")).toBeVisible();
  82 |   });
  83 | });
  84 | 
```