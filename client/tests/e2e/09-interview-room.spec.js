import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_INTERVIEW = {
  success: true,
  data: {
    _id: "intv-001",
    title: "Frontend Engineer Interview",
    status: "active",
    roomCode: "CC-A1B2C3D4",
    scheduledAt: "2025-01-15T10:00:00Z",
    duration: 60,
    interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
    candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
    problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  },
};

const MOCK_PROBLEM = {
  success: true,
  data: {
    _id: "prob-001",
    title: "Two Sum",
    description: "Given array nums and integer target, return indices.",
    difficulty: "Easy",
    category: "Arrays",
    supportedLanguages: ["javascript", "python"],
    timeLimit: 1000,
    memoryLimit: 256,
    starterCode: { javascript: "function twoSum(nums, target) {}", python: "def twoSum(): pass" },
    examples: [],
    constraints: "1 <= n <= 10^4",
    tags: [],
  },
};

test.describe("Interview Room", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/problems/prob-001**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM) })
    );
    // Mock socket and WebRTC calls to prevent errors
    await page.addInitScript(() => {
      window.__playwright_test__ = true;
    });
  });

  test("interview room page loads without crashing", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    await expect(page.locator("body")).toBeVisible();
    // Should not redirect to login or unauthorized
    await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  });

  test("interview room renders interview title or header", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    await expect(page.getByText(/Frontend Engineer Interview|CodeCollab/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("interview room renders Monaco editor", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    const editor = page.locator(".monaco-editor, [data-keybinding-context]");
    await expect(editor.first()).toBeVisible({ timeout: 15000 });
  });

  test("interview room has language selector", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    await expect(
      page.getByRole("combobox").first().or(page.getByText(/javascript|python|language/i).first())
    ).toBeVisible({ timeout: 10000 });
  });

  test("interview room has run code button", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    await expect(page.getByRole("button", { name: /run/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test("interview room has problem description panel", async ({ page }) => {
    await page.goto("/interviews/intv-001/room");
    await expect(page.getByText(/Two Sum|description/i).first()).toBeVisible({ timeout: 10000 });
  });
});
