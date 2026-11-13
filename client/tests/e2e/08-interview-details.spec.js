import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_INTERVIEW = {
  success: true,
  data: {
    _id: "intv-001",
    title: "Frontend Engineer Interview",
    status: "scheduled",
    roomCode: "CC-A1B2C3D4",
    scheduledAt: "2025-01-15T10:00:00Z",
    duration: 60,
    interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
    candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
    problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  },
};

const MOCK_COMPLETED_INTERVIEW = {
  success: true,
  data: {
    ...MOCK_INTERVIEW.data,
    _id: "intv-002",
    status: "completed",
    roomCode: "CC-B2C3D4E5",
  },
};

test.describe("Interview Details", () => {
  test("interview details page renders title", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText("Frontend Engineer Interview")).toBeVisible();
  });

  test("interview details page renders status badge", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText(/scheduled/i).first()).toBeVisible();
  });

  test("interview details page renders room code", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText(/CC-A1B2C3D4/i)).toBeVisible();
  });

  test("interview details page renders interviewer name", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText("Bob Interviewer")).toBeVisible();
  });

  test("interview details page renders candidate name", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText("Alice Candidate")).toBeVisible();
  });

  test("completed interview shows replay link", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_COMPLETED_INTERVIEW) })
    );
    await page.goto("/interviews/intv-002");
    await expect(page.getByRole("link", { name: /replay/i }).or(page.getByText(/replay/i)).first()).toBeVisible();
  });

  test("interview detail shows duration", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-001", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.goto("/interviews/intv-001");
    await expect(page.getByText(/60|1 hour/i).first()).toBeVisible();
  });
});
