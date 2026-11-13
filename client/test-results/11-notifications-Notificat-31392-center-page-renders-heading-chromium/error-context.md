# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-notifications.spec.js >> Notification Center >> notification center page renders heading
- Location: tests\e2e\11-notifications.spec.js:30:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /notification/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /notification/i }) with timeout 10000ms
  - waiting for getByRole('heading', { name: /notification/i })

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
  4  | const MOCK_NOTIFICATIONS = {
  5  |   success: true,
  6  |   data: [
  7  |     { _id: "notif-001", title: "Interview Scheduled", message: "Your interview is scheduled for tomorrow.", isRead: false, type: "interview", createdAt: "2024-06-01T10:00:00Z" },
  8  |     { _id: "notif-002", title: "Evaluation Complete", message: "Your evaluation has been submitted.", isRead: true, type: "evaluation", createdAt: "2024-06-02T11:00:00Z" },
  9  |   ],
  10 |   pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  11 | };
  12 | 
  13 | test.describe("Notification Center", () => {
  14 |   test.beforeEach(async ({ page }) => {
  15 |     await mockAuthMe(page, "candidate");
  16 |     await loginAs(page, "candidate");
  17 |     await page.route("**/api/notifications/unread-count**", (r) =>
  18 |       r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { unreadCount: 1 } }) })
  19 |     );
  20 |     await page.route("**/api/notifications**", (r) => {
  21 |       const url = r.request().url();
  22 |       if (url.includes("read-all") || r.request().method() === "PATCH" || r.request().method() === "DELETE") {
  23 |         r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  24 |       } else {
  25 |         r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_NOTIFICATIONS) });
  26 |       }
  27 |     });
  28 |   });
  29 | 
  30 |   test("notification center page renders heading", async ({ page }) => {
  31 |     await page.goto("/notifications");
> 32 |     await expect(page.getByRole("heading", { name: /notification/i })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  33 |   });
  34 | 
  35 |   test("notification cards render with titles", async ({ page }) => {
  36 |     await page.goto("/notifications");
  37 |     await expect(page.getByText("Interview Scheduled")).toBeVisible();
  38 |     await expect(page.getByText("Evaluation Complete")).toBeVisible();
  39 |   });
  40 | 
  41 |   test("notification messages are displayed", async ({ page }) => {
  42 |     await page.goto("/notifications");
  43 |     await expect(page.getByText(/scheduled for tomorrow/i)).toBeVisible();
  44 |   });
  45 | 
  46 |   test("filter buttons All and Unread are visible", async ({ page }) => {
  47 |     await page.goto("/notifications");
  48 |     await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();
  49 |     await expect(page.getByRole("button", { name: /unread/i }).first()).toBeVisible();
  50 |   });
  51 | 
  52 |   test("mark all as read button is clickable", async ({ page }) => {
  53 |     await page.goto("/notifications");
  54 |     const markAllBtn = page.getByRole("button", { name: /mark all/i });
  55 |     if (await markAllBtn.isVisible()) {
  56 |       await markAllBtn.click();
  57 |       await expect(page.locator("body")).toBeVisible();
  58 |     }
  59 |   });
  60 | 
  61 |   test("search input exists", async ({ page }) => {
  62 |     await page.goto("/notifications");
  63 |     const searchInput = page.getByPlaceholder(/search/i);
  64 |     if (await searchInput.isVisible()) {
  65 |       await searchInput.fill("Interview");
  66 |       await expect(searchInput).toHaveValue("Interview");
  67 |     }
  68 |   });
  69 | 
  70 |   test("unread filter shows only unread notifications", async ({ page }) => {
  71 |     await page.goto("/notifications");
  72 |     await page.getByRole("button", { name: /unread/i }).first().click();
  73 |     await expect(page.locator("body")).toBeVisible();
  74 |   });
  75 | });
  76 | 
```