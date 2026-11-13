# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-interview-room.spec.js >> Interview Room >> interview room page loads without crashing
- Location: tests\e2e\09-interview-room.spec.js:53:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /.*login|.*unauthorized/
Received string: "http://127.0.0.1:5173/login"
Timeout: 10000ms

Call log:
  - Expect "not toHaveURL" with timeout 10000ms
    20 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://127.0.0.1:5173/login"
    - waiting for "http://127.0.0.1:5173/login" navigation to finish...
    - navigated to "http://127.0.0.1:5173/login"
    3 × locator resolved to <html lang="en">…</html>
      - unexpected value "http://127.0.0.1:5173/login"

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - link "CodeCollab" [ref=f1e7] [cursor=pointer]:
      - /url: /
    - generic [ref=f1e14]:
      - generic [ref=f1e15]: Collaborative coding starts here
      - heading "Think together. Code together. Succeed together." [level=1] [ref=f1e17]: Think together.Code together.Succeed together.
      - paragraph [ref=f1e18]: A collaborative space for technical interviews, coding challenges and real-time problem solving.
      - generic [ref=f1e19]:
        - generic [ref=f1e24]:
          - heading "Powerful coding workspace" [level=3] [ref=f1e25]
          - paragraph [ref=f1e26]: Write and execute code in multiple languages.
        - generic [ref=f1e34]:
          - heading "Real-time collaboration" [level=3] [ref=f1e35]
          - paragraph [ref=f1e36]: Work together in a shared interview room.
        - generic [ref=f1e42]:
          - heading "Structured evaluations" [level=3] [ref=f1e43]
          - paragraph [ref=f1e44]: Track performance with interview scorecards.
    - paragraph [ref=f1e45]: © 2026 CodeCollab. Built for better technical interviews.
  - generic [ref=f1e47]:
    - generic [ref=f1e48]:
      - heading "Welcome back" [level=2] [ref=f1e49]
      - paragraph [ref=f1e50]: Sign in to continue to your CodeCollab workspace.
    - generic [ref=f1e51]:
      - generic [ref=f1e52]:
        - generic [ref=f1e53]: Email address
        - textbox "Email address" [ref=f1e58]:
          - /placeholder: you@example.com
      - generic [ref=f1e59]:
        - generic [ref=f1e60]: Password
        - generic [ref=f1e62]:
          - textbox "Password" [ref=f1e66]:
            - /placeholder: Enter your password
          - button "Show password" [ref=f1e67]
      - button "Sign in" [ref=f1e71]
    - generic [ref=f1e74]: NEW TO CODECOLLAB?
    - paragraph [ref=f1e78]:
      - text: Don't have an account?
      - link "Create account" [ref=f1e79] [cursor=pointer]:
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
  7  |     _id: "intv-001",
  8  |     title: "Frontend Engineer Interview",
  9  |     status: "active",
  10 |     roomCode: "CC-A1B2C3D4",
  11 |     scheduledAt: "2025-01-15T10:00:00Z",
  12 |     duration: 60,
  13 |     interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
  14 |     candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
  15 |     problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  16 |   },
  17 | };
  18 | 
  19 | const MOCK_PROBLEM = {
  20 |   success: true,
  21 |   data: {
  22 |     _id: "prob-001",
  23 |     title: "Two Sum",
  24 |     description: "Given array nums and integer target, return indices.",
  25 |     difficulty: "Easy",
  26 |     category: "Arrays",
  27 |     supportedLanguages: ["javascript", "python"],
  28 |     timeLimit: 1000,
  29 |     memoryLimit: 256,
  30 |     starterCode: { javascript: "function twoSum(nums, target) {}", python: "def twoSum(): pass" },
  31 |     examples: [],
  32 |     constraints: "1 <= n <= 10^4",
  33 |     tags: [],
  34 |   },
  35 | };
  36 | 
  37 | test.describe("Interview Room", () => {
  38 |   test.beforeEach(async ({ page }) => {
  39 |     await mockAuthMe(page, "interviewer");
  40 |     await loginAs(page, "interviewer");
  41 |     await page.route("**/api/interviews/intv-001", (r) =>
  42 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
  43 |     );
  44 |     await page.route("**/api/problems/prob-001**", (r) =>
  45 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM) })
  46 |     );
  47 |     // Mock socket and WebRTC calls to prevent errors
  48 |     await page.addInitScript(() => {
  49 |       window.__playwright_test__ = true;
  50 |     });
  51 |   });
  52 | 
  53 |   test("interview room page loads without crashing", async ({ page }) => {
  54 |     await page.goto("/interviews/intv-001/room");
  55 |     await expect(page.locator("body")).toBeVisible();
  56 |     // Should not redirect to login or unauthorized
> 57 |     await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
     |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  58 |   });
  59 | 
  60 |   test("interview room renders interview title or header", async ({ page }) => {
  61 |     await page.goto("/interviews/intv-001/room");
  62 |     await expect(page.getByText(/Frontend Engineer Interview|CodeCollab/i).first()).toBeVisible({ timeout: 10000 });
  63 |   });
  64 | 
  65 |   test("interview room renders Monaco editor", async ({ page }) => {
  66 |     await page.goto("/interviews/intv-001/room");
  67 |     const editor = page.locator(".monaco-editor, [data-keybinding-context]");
  68 |     await expect(editor.first()).toBeVisible({ timeout: 15000 });
  69 |   });
  70 | 
  71 |   test("interview room has language selector", async ({ page }) => {
  72 |     await page.goto("/interviews/intv-001/room");
  73 |     await expect(
  74 |       page.getByRole("combobox").first().or(page.getByText(/javascript|python|language/i).first())
  75 |     ).toBeVisible({ timeout: 10000 });
  76 |   });
  77 | 
  78 |   test("interview room has run code button", async ({ page }) => {
  79 |     await page.goto("/interviews/intv-001/room");
  80 |     await expect(page.getByRole("button", { name: /run/i }).first()).toBeVisible({ timeout: 10000 });
  81 |   });
  82 | 
  83 |   test("interview room has problem description panel", async ({ page }) => {
  84 |     await page.goto("/interviews/intv-001/room");
  85 |     await expect(page.getByText(/Two Sum|description/i).first()).toBeVisible({ timeout: 10000 });
  86 |   });
  87 | });
  88 | 
```