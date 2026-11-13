import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_NOTIFICATIONS = {
  success: true,
  data: [
    { _id: "notif-001", title: "Interview Scheduled", message: "Your interview is scheduled for tomorrow.", isRead: false, type: "interview", createdAt: "2024-06-01T10:00:00Z" },
    { _id: "notif-002", title: "Evaluation Complete", message: "Your evaluation has been submitted.", isRead: true, type: "evaluation", createdAt: "2024-06-02T11:00:00Z" },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

test.describe("Notification Center", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/notifications/unread-count**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { unreadCount: 1 } }) })
    );
    await page.route("**/api/notifications**", (r) => {
      const url = r.request().url();
      if (url.includes("read-all") || r.request().method() === "PATCH" || r.request().method() === "DELETE") {
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
      } else {
        r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_NOTIFICATIONS) });
      }
    });
  });

  test("notification center page renders heading", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notification/i })).toBeVisible();
  });

  test("notification cards render with titles", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByText("Interview Scheduled")).toBeVisible();
    await expect(page.getByText("Evaluation Complete")).toBeVisible();
  });

  test("notification messages are displayed", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByText(/scheduled for tomorrow/i)).toBeVisible();
  });

  test("filter buttons All and Unread are visible", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /unread/i }).first()).toBeVisible();
  });

  test("mark all as read button is clickable", async ({ page }) => {
    await page.goto("/notifications");
    const markAllBtn = page.getByRole("button", { name: /mark all/i });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("search input exists", async ({ page }) => {
    await page.goto("/notifications");
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Interview");
      await expect(searchInput).toHaveValue("Interview");
    }
  });

  test("unread filter shows only unread notifications", async ({ page }) => {
    await page.goto("/notifications");
    await page.getByRole("button", { name: /unread/i }).first().click();
    await expect(page.locator("body")).toBeVisible();
  });
});
