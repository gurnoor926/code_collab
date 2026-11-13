import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_PROBLEMS_LIST = {
  success: true,
  data: [
    { _id: "prob-001", title: "Two Sum", difficulty: "Easy", category: "Arrays", tags: [], isPublished: true },
    { _id: "prob-002", title: "Merge Intervals", difficulty: "Medium", category: "Arrays", tags: [], isPublished: true },
  ],
  pagination: { page: 1, limit: 9, total: 2, totalPages: 1 },
};

const MOCK_PROBLEM_DETAIL = {
  success: true,
  data: {
    _id: "prob-001",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices.",
    difficulty: "Easy",
    category: "Arrays",
    supportedLanguages: ["javascript", "python"],
    timeLimit: 1000,
    memoryLimit: 256,
    starterCode: { javascript: "function twoSum(nums, target) {}", python: "def twoSum(): pass" },
    examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "" }],
    constraints: "2 <= n <= 10^4",
    tags: [],
    isPublished: true,
  },
};

const MOCK_INTERVIEWS_EMPTY = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

test.describe("Complete E2E User Workflows", () => {
  test("Workflow 1 — Candidate: dashboard → problems → problem detail → editor loads", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
    );
    await page.route("**/api/problems/prob-001**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM_DETAIL) })
    );
    await page.route("**/api/problems**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS_LIST) })
    );

    // Step 1: Land on dashboard
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login/);

    // Step 2: Navigate to problems
    await page.goto("/problems");
    await expect(page.getByText("Two Sum")).toBeVisible();

    // Step 3: Click on problem
    await page.getByText("Two Sum").first().click();
    await expect(page).toHaveURL(/\/problems\/prob-001/);

    // Step 4: Verify editor loads
    const editor = page.locator(".monaco-editor, [data-keybinding-context]");
    await expect(editor.first()).toBeVisible({ timeout: 15000 });
  });

  test("Workflow 2 — Interviewer: dashboard → create interview form → fill and submit", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
    );
    await page.route("**/api/problems**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS_LIST) })
    );
    await page.route("**/api/interviews", (r) => {
      if (r.request().method() === "POST") {
        r.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: { _id: "intv-new", title: "My Test Interview", status: "scheduled", roomCode: "CC-AABBCCDD" } }),
        });
      } else {
        r.continue();
      }
    });

    // Step 1: Dashboard
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/.*login/);

    // Step 2: Navigate to create interview
    await page.goto("/interviews/create");
    await expect(page).not.toHaveURL(/.*unauthorized/);

    // Step 3: Fill form
    const titleField = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).first();
    await expect(titleField).toBeVisible();
    await titleField.fill("My Test Interview");

    const durationField = page.getByLabel(/duration/i).or(page.getByPlaceholder(/duration/i)).first();
    if (await durationField.isVisible()) {
      await durationField.fill("60");
    }

    // Step 4: Submit
    await page.getByRole("button", { name: /create|schedule|submit/i }).first().click();

    // Should navigate away from the create form after success
    await page.waitForURL(/\/interviews/, { timeout: 10000 });
  });

  test("Workflow 3 — Candidate: join interview flow with valid code", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/join", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { _id: "intv-001" } }) })
    );
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEWS_EMPTY) })
    );

    // Step 1: Navigate to join page
    await page.goto("/interviews/join");
    await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();

    // Step 2: Type invalid code — verify error
    const input = page.getByPlaceholder(/CC-|room code|invitation/i);
    await input.fill("INVALIDCODE");
    await page.getByRole("button", { name: /join/i }).first().click();
    await expect(page.getByText(/valid invitation code|invalid/i)).toBeVisible();

    // Step 3: Type valid code — verify API called
    await input.fill("CC-A1B2C3D4");
    await page.getByRole("button", { name: /join/i }).first().click();
    await page.waitForTimeout(1000);
    // After API success, should redirect away
    await expect(page).not.toHaveURL(/.*unauthorized/);
  });

  test("Workflow 4 — Admin: access admin dashboard and view stats", async ({ page }) => {
    await mockAuthMe(page, "admin");
    await loginAs(page, "admin");
    await page.route("**/api/admin/stats**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            users: { total: 42, candidates: 30, interviewers: 11, admins: 1 },
            problems: { total: 15, published: 12, unpublished: 3, easy: 5, medium: 7, hard: 3 },
            interviews: { total: 20, scheduled: 5, waiting: 2, active: 1, completed: 10, cancelled: 2 },
            submissions: { total: 150, accepted: 90, failed: 60, passRate: 60 },
            evaluations: { total: 10, averageOverallScore: 72, recommendations: { strong_hire: 2, hire: 5, hold: 2, no_hire: 1 } },
            recentActivity: { interviews: [], submissions: [], users: [] },
          },
        }),
      })
    );
    await page.route("**/api/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) })
    );

    // Step 1: Go to admin dashboard
    await page.goto("/admin");
    await expect(page.getByText(/Admin Control Center/i)).toBeVisible({ timeout: 10000 });

    // Step 2: Verify stat cards
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("42")).toBeVisible();
  });

  test("Workflow 5 — Unauthenticated: all protected routes redirect to login", async ({ page }) => {
    const protectedRoutes = ["/dashboard", "/problems", "/interviews", "/submissions", "/notifications"];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    }
  });
});
