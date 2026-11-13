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
    problems: [{ _id: "prob-001", title: "Two Sum", difficulty: "Easy" }],
  },
};

const MOCK_EVALUATION = {
  success: true,
  data: {
    _id: "eval-001",
    interview: "intv-002",
    candidate: { _id: "user-cand-001", name: "Alice Candidate" },
    interviewer: { _id: "user-intw-001", name: "Bob Interviewer" },
    scores: { technicalSkills: 80, problemSolving: 75, communication: 85, codeQuality: 78 },
    overallScore: 80,
    recommendation: "hire",
    notes: "Strong candidate with good problem-solving skills.",
    status: "submitted",
    createdAt: "2025-01-10T16:00:00Z",
  },
};

test.describe("Evaluation & Scorecard", () => {
  test("interviewer can access evaluation page for completed interview", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
    );
    await page.goto("/interviews/intv-002/evaluation");
    await expect(page).not.toHaveURL(/.*login|.*unauthorized/);
  });

  test("evaluation page renders candidate name", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
    );
    await page.goto("/interviews/intv-002/evaluation");
    await expect(page.getByText("Alice Candidate")).toBeVisible({ timeout: 10000 });
  });

  test("evaluation page renders score/rating fields", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) })
    );
    await page.goto("/interviews/intv-002/evaluation");
    await expect(
      page.getByText(/technical|problem solving|communication|code quality/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("evaluation page renders recommendation selector", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) })
    );
    await page.goto("/interviews/intv-002/evaluation");
    await expect(
      page.getByText(/strong hire|hire|hold|no hire/i).first().or(page.getByRole("combobox").first())
    ).toBeVisible({ timeout: 10000 });
  });

  test("candidate scorecard page renders overall score", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
    );
    await page.goto("/interviews/intv-002/scorecard");
    await expect(page.getByText(/scorecard|score|evaluation/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("candidate scorecard shows recommendation", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/intv-002**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_INTERVIEW) })
    );
    await page.route("**/api/evaluations/**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_EVALUATION) })
    );
    await page.goto("/interviews/intv-002/scorecard");
    await expect(page.getByText(/hire|strong hire/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("candidate cannot access interviewer evaluation page", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.goto("/interviews/intv-002/evaluation");
    await expect(page).toHaveURL(/.*unauthorized|.*login/);
  });
});
