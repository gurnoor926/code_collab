import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_SUBMISSIONS = {
  success: true,
  data: {
    submissions: [
      {
        _id: "sub-001",
        problem: { _id: "prob-001", title: "Two Sum" },
        language: "javascript",
        status: "Accepted",
        executionTime: 42,
        memoryUsed: 38,
        submittedAt: "2024-06-01T10:00:00Z",
        passedTestCases: 10,
        totalTestCases: 10,
      },
      {
        _id: "sub-002",
        problem: { _id: "prob-002", title: "Longest Substring" },
        language: "python",
        status: "Wrong Answer",
        executionTime: 120,
        memoryUsed: 44,
        submittedAt: "2024-06-02T11:00:00Z",
        passedTestCases: 7,
        totalTestCases: 10,
      },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

const MOCK_SUB_DETAIL = {
  success: true,
  data: {
    _id: "sub-001",
    problem: { _id: "prob-001", title: "Two Sum" },
    language: "javascript",
    status: "Accepted",
    code: "function twoSum(nums, target) { return [0,1]; }",
    executionTime: 42,
    memoryUsed: 38,
    submittedAt: "2024-06-01T10:00:00Z",
    passedTestCases: 10,
    totalTestCases: 10,
  },
};

test.describe("Submission History & Detail", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
  });

  test("submission history page renders submission rows", async ({ page }) => {
    await page.route("**/api/submissions/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
    );
    await page.goto("/submissions");
    await expect(page.getByText("Two Sum")).toBeVisible();
    await expect(page.getByText("Longest Substring")).toBeVisible();
  });

  test("submission history page shows status badges", async ({ page }) => {
    await page.route("**/api/submissions/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
    );
    await page.goto("/submissions");
    await expect(page.getByText("Accepted").first()).toBeVisible();
    await expect(page.getByText("Wrong Answer").first()).toBeVisible();
  });

  test("submission history page has language labels", async ({ page }) => {
    await page.route("**/api/submissions/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUBMISSIONS) })
    );
    await page.goto("/submissions");
    await expect(page.getByText(/javascript/i).first()).toBeVisible();
  });

  test("submission detail renders status and language", async ({ page }) => {
    await page.route("**/api/submissions/sub-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
    );
    await page.goto("/submissions/sub-001");
    await expect(page.getByText("Accepted").first()).toBeVisible();
    await expect(page.getByText(/javascript/i).first()).toBeVisible();
  });

  test("submission detail renders problem title", async ({ page }) => {
    await page.route("**/api/submissions/sub-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
    );
    await page.goto("/submissions/sub-001");
    await expect(page.getByText("Two Sum")).toBeVisible();
  });

  test("submission detail shows code", async ({ page }) => {
    await page.route("**/api/submissions/sub-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SUB_DETAIL) })
    );
    await page.goto("/submissions/sub-001");
    await expect(page.getByText(/twoSum|function/i)).toBeVisible();
  });
});
