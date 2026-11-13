# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-notifications.spec.js >> Notification Center >> unread filter shows only unread notifications
- Location: tests\e2e\11-notifications.spec.js:70:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /unread/i }).first()

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
  32 |     await expect(page.getByRole("heading", { name: /notification/i })).toBeVisible();
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
> 72 |     await page.getByRole("button", { name: /unread/i }).first().click();
     |                                                                 ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  73 |     await expect(page.locator("body")).toBeVisible();
  74 |   });
  75 | });
  76 | 
```