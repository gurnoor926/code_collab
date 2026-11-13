import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

test.describe("Create Interview (Interviewer)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/problems**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      })
    );
  });

  test("create interview form renders title field", async ({ page }) => {
    await page.goto("/interviews/create");
    await expect(page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first()).toBeVisible();
  });

  test("create interview form renders description field", async ({ page }) => {
    await page.goto("/interviews/create");
    await expect(page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i)).first()).toBeVisible();
  });

  test("create interview form renders duration field", async ({ page }) => {
    await page.goto("/interviews/create");
    await expect(page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first()).toBeVisible();
  });

  test("create interview form renders scheduled date field", async ({ page }) => {
    await page.goto("/interviews/create");
    // Look for a datetime-local input or date picker
    const dateInput = page.locator("input[type='datetime-local'], input[type='date']");
    await expect(dateInput.first()).toBeVisible();
  });

  test("create interview page has a submit/create button", async ({ page }) => {
    await page.goto("/interviews/create");
    await expect(page.getByRole("button", { name: /create|schedule|submit/i }).first()).toBeVisible();
  });

  test("form has problem selection section", async ({ page }) => {
    await page.goto("/interviews/create");
    await expect(page.getByText(/problem|select problem/i).first()).toBeVisible();
  });

  test("successful interview creation redirects away from create page", async ({ page }) => {
    await page.route("**/api/interviews", (r) => {
      if (r.request().method() === "POST") {
        r.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { _id: "intv-new", title: "New Interview", status: "scheduled", roomCode: "CC-AABBCCDD" },
          }),
        });
      } else {
        r.continue();
      }
    });
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
    );
    await page.goto("/interviews/create");
    // Fill title
    const titleField = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first();
    await titleField.fill("Test Interview");
    // Fill duration
    const durationField = page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first();
    await durationField.fill("60");
    // Submit
    await page.getByRole("button", { name: /create|schedule|submit/i }).first().click();
    // Should redirect to interviews list
    await expect(page).toHaveURL(/\/interviews($|\?|\/[a-f0-9])/);
  });
});
