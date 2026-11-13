import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

test.describe("Join Interview (Candidate)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
  });

  test("join interview page renders heading", async ({ page }) => {
    await page.goto("/interviews/join");
    await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();
  });

  test("join interview page has room code input", async ({ page }) => {
    await page.goto("/interviews/join");
    await expect(page.getByPlaceholder(/CC-|room code|invitation/i)).toBeVisible();
  });

  test("join interview page has submit button", async ({ page }) => {
    await page.goto("/interviews/join");
    await expect(page.getByRole("button", { name: /join/i }).first()).toBeVisible();
  });

  test("submitting invalid code shows error", async ({ page }) => {
    await page.goto("/interviews/join");
    const input = page.getByPlaceholder(/CC-|room code|invitation/i);
    await input.fill("BADCODE");
    await page.getByRole("button", { name: /join/i }).first().click();
    await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();
  });

  test("submitting another invalid code format shows error", async ({ page }) => {
    await page.goto("/interviews/join");
    const input = page.getByPlaceholder(/CC-|room code|invitation/i);
    await input.fill("CC-12345");
    await page.getByRole("button", { name: /join/i }).first().click();
    await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();
  });

  test("submitting valid code CC-A1B2C3D4 triggers API call", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/interviews/join", (r) => {
      apiCalled = true;
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { _id: "intv-001" } }),
      });
    });
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
    );
    await page.goto("/interviews/join");
    const input = page.getByPlaceholder(/CC-|room code|invitation/i);
    await input.fill("CC-A1B2C3D4");
    await page.getByRole("button", { name: /join/i }).first().click();
    await page.waitForTimeout(1000);
    expect(apiCalled).toBe(true);
  });
});
