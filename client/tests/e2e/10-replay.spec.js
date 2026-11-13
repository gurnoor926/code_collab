import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_INTERVIEW = {
  success: true,
  data: {
    _id: "intv-002",
    title: "Backend Systems Interview",
    status: "completed",
    roomCode: "CC-B2C3D4E5",
    scheduledAt: "2025-01-10T14:00:00Z",
    duration: 90,
    interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
    candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
    problems: [],
  },
};

const MOCK_REPLAY_EVENTS = {
  success: true,
  data: [
    { _id: "evt-001", eventType: "code_change", payload: { code: "function hello() {}" }, timestamp: "2025-01-10T14:01:00Z", elapsedMs: 60000 },
    { _id: "evt-002", eventType: "language_change", payload: { language: "python" }, timestamp: "2025-01-10T14:05:00Z", elapsedMs: 300000 },
    { _id: "evt-003", eventType: "code_run", payload: { status: "Accepted" }, timestamp: "2025-01-10T14:30:00Z", elapsedMs: 1800000 },
  ],
};

test.describe("Interview Replay", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/replays/intv-002/events**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REPLAY_EVENTS) })
    );
    await page.route("**/api/replays/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REPLAY_EVENTS) })
    );
  });

  test("replay page loads without crashing", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  });

  test("replay page renders play/pause control", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    await expect(
      page.getByRole("button", { name: /play|pause/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("replay page renders speed controls", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    await expect(page.getByText(/1x|speed|0\.5x|2x/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("replay page renders event list items", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    await expect(
      page.getByText(/code_change|language_change|code_run|event/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("replay page renders interview title or header", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    await expect(
      page.getByText(/Backend Systems Interview|replay/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("play button is clickable", async ({ page }) => {
    await page.goto("/interviews/intv-002/replay");
    const playBtn = page.getByRole("button", { name: /play|pause/i }).first();
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();
    // Should not crash — just verify page is still visible
    await expect(page.locator("body")).toBeVisible();
  });
});
