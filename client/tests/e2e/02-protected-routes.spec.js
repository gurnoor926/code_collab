import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_INTERVIEWS = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

test.describe("Protected Routes & Role Guards", () => {
  test("candidate can access /dashboard", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS) })
    );
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login/);
  });

  test("interviewer can access /dashboard", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS) })
    );
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login/);
  });

  test("admin can access /dashboard", async ({ page }) => {
    await mockAuthMe(page, "admin");
    await loginAs(page, "admin");
    await page.route("**/api/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: {} }) })
    );
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login/);
  });

  test("candidate trying to access /interviews/create redirects to /unauthorized", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/interviews/create");
    await expect(page).toHaveURL(/.*unauthorized/);
  });

  test("candidate trying to access /admin redirects to /unauthorized", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*unauthorized/);
  });

  test("interviewer trying to access /admin redirects to /unauthorized", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*unauthorized/);
  });

  test("candidate can access /interviews/join", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/interviews/join");
    await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
    await expect(page.getByText(/join/i).first()).toBeVisible();
  });

  test("interviewer can access /interviews/create", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/problems**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
    );
    await page.goto("/interviews/create");
    await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  });

  test("candidate trying to access /evaluations redirects to /unauthorized", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/evaluations");
    await expect(page).toHaveURL(/.*unauthorized/);
  });
});
