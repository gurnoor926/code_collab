import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_STATS = {
  success: true,
  data: {
    users: { total: 42, candidates: 30, interviewers: 11, admins: 1 },
    problems: { total: 15, published: 12, unpublished: 3, easy: 5, medium: 7, hard: 3 },
    interviews: { total: 20, scheduled: 5, waiting: 2, active: 1, completed: 10, cancelled: 2 },
    submissions: { total: 150, accepted: 90, failed: 60, passRate: 60 },
    evaluations: { total: 10, averageOverallScore: 72, recommendations: { strong_hire: 2, hire: 5, hold: 2, no_hire: 1 } },
    recentActivity: { interviews: [], submissions: [], users: [] },
  },
};

const MOCK_USERS = {
  success: true,
  data: [
    { _id: "u1", name: "Alice Candidate", email: "alice@test.com", role: "candidate", createdAt: "2024-01-01T00:00:00Z" },
    { _id: "u2", name: "Bob Interviewer", email: "bob@test.com", role: "interviewer", createdAt: "2024-01-02T00:00:00Z" },
  ],
  pagination: { page: 1, limit: 15, total: 2, totalPages: 1 },
};

const MOCK_INTERVIEWS_LIST = {
  success: true,
  data: [
    { _id: "intv-001", title: "Frontend Interview", status: "scheduled", roomCode: "CC-A1B2C3D4", interviewer: { name: "Bob" }, candidate: { name: "Alice" }, scheduledAt: "2025-01-15T10:00:00Z" },
  ],
  pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
};

const MOCK_PROBLEMS = {
  success: true,
  data: [
    { _id: "prob-001", title: "Two Sum", difficulty: "Easy", category: "Arrays", isPublished: true, tags: [] },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "admin");
    await loginAs(page, "admin");
    // Mock all admin service fallback APIs
    await page.route("**/api/admin/stats**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_STATS) })
    );
    await page.route("**/api/admin/users**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_USERS) })
    );
    await page.route("**/api/admin/interviews**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_LIST) })
    );
    await page.route("**/api/problems**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS) })
    );
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_LIST) })
    );
    await page.route("**/api/submissions/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { submissions: [], pagination: { total: 0 } } }) })
    );
    await page.route("**/api/evaluations/dashboard**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: {} }) })
    );
  });

  test("admin dashboard renders Admin Control Center heading", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Admin Control Center/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin dashboard overview tab shows Total Users stat card", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin dashboard overview tab shows Coding Problems stat card", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Coding Problems/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin dashboard overview tab shows Interview Sessions stat card", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Interview Sessions/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin dashboard overview tab shows Total Submissions stat card", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/Total Submissions/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin dashboard has tab buttons", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: /Overview/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Problem Bank/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Interviews/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Users/i })).toBeVisible({ timeout: 10000 });
  });

  test("clicking Users tab renders user table", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /Users/i }).click();
    await expect(page.getByText("Alice Candidate")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Bob Interviewer")).toBeVisible({ timeout: 10000 });
  });

  test("users table shows role badges", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /Users/i }).click();
    await expect(page.getByText(/candidate/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/interviewer/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking Interviews tab renders interview table", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /Interviews/i }).click();
    await expect(page.getByText("Frontend Interview")).toBeVisible({ timeout: 10000 });
  });

  test("interviews table shows status badge", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /Interviews/i }).click();
    await expect(page.getByText(/scheduled/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("clicking Problem Bank tab renders problem table", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /Problem Bank/i }).click();
    await expect(page.getByText("Two Sum")).toBeVisible({ timeout: 10000 });
  });

  test("admin stat numbers render correctly from mocked data", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("42")).toBeVisible({ timeout: 10000 }); // Total users
    await expect(page.getByText("15")).toBeVisible({ timeout: 10000 }); // Total problems
  });
});
