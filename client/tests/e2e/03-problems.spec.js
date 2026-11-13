import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_PROBLEMS = {
  success: true,
  data: [
    {
      _id: "prob-001",
      title: "Two Sum",
      difficulty: "Easy",
      category: "Arrays",
      tags: ["array", "hash-table"],
      isPublished: true,
    },
    {
      _id: "prob-002",
      title: "Longest Substring",
      difficulty: "Medium",
      category: "Strings",
      tags: ["sliding-window"],
      isPublished: true,
    },
    {
      _id: "prob-003",
      title: "Median of Arrays",
      difficulty: "Hard",
      category: "Binary Search",
      tags: ["binary-search"],
      isPublished: true,
    },
  ],
  pagination: { page: 1, limit: 9, total: 3, totalPages: 1 },
};

const MOCK_PROBLEM_DETAIL = {
  success: true,
  data: {
    _id: "prob-001",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    difficulty: "Easy",
    category: "Arrays",
    constraints: "2 <= nums.length <= 10^4",
    examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" }],
    supportedLanguages: ["javascript", "python", "cpp", "java"],
    timeLimit: 1000,
    memoryLimit: 256,
    tags: ["array"],
    isPublished: true,
    starterCode: { javascript: "function twoSum(nums, target) {\n  // your code\n}", python: "def twoSum(nums, target):\n    pass" },
  },
};

test.describe("Problem Library", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/problems**", (route) => {
      const url = route.request().url();
      if (url.match(/problems\/prob-001/)) {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM_DETAIL) });
      } else {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS) });
      }
    });
  });

  test("problem library page renders problem cards", async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByText("Two Sum")).toBeVisible();
    await expect(page.getByText("Longest Substring")).toBeVisible();
    await expect(page.getByText("Median of Arrays")).toBeVisible();
  });

  test("difficulty badges are visible", async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByText("Easy").first()).toBeVisible();
    await expect(page.getByText("Medium").first()).toBeVisible();
    await expect(page.getByText("Hard").first()).toBeVisible();
  });

  test("search input exists and is typeable", async ({ page }) => {
    await page.goto("/problems");
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Two Sum");
    await expect(searchInput).toHaveValue("Two Sum");
  });

  test("difficulty filter buttons exist", async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByRole("button", { name: /easy/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /medium/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /hard/i }).first()).toBeVisible();
  });

  test("clicking a problem navigates to /problems/:id", async ({ page }) => {
    await page.goto("/problems");
    await page.getByText("Two Sum").first().click();
    await expect(page).toHaveURL(/\/problems\/prob-001/);
  });

  test("problem detail page renders title and difficulty badge", async ({ page }) => {
    await page.goto("/problems/prob-001");
    await expect(page.getByText("Two Sum")).toBeVisible();
    await expect(page.getByText("Easy").first()).toBeVisible();
  });

  test("problem detail page renders description", async ({ page }) => {
    await page.goto("/problems/prob-001");
    await expect(page.getByText(/return indices/i)).toBeVisible();
  });

  test("Monaco editor container renders on problem detail", async ({ page }) => {
    await page.goto("/problems/prob-001");
    // Monaco editor DOM element
    const editor = page.locator(".monaco-editor, [data-keybinding-context]");
    await expect(editor.first()).toBeVisible({ timeout: 15000 });
  });

  test("language selector exists on problem detail", async ({ page }) => {
    await page.goto("/problems/prob-001");
    await expect(page.getByRole("combobox").first().or(page.getByText(/javascript|python/i).first())).toBeVisible();
  });

  test("Run and Submit buttons exist on problem detail", async ({ page }) => {
    await page.goto("/problems/prob-001");
    await expect(page.getByRole("button", { name: /run/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /submit/i }).first()).toBeVisible();
  });
});
