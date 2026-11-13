import { test, expect } from "@playwright/test";
import { loginAs, mockAuthMe } from "./helpers/auth.js";

const MOCK_INTERVIEWS_DATA = [
  {
    _id: "intv-001",
    title: "Frontend Engineer Interview",
    status: "scheduled",
    roomCode: "CC-A1B2C3D4",
    scheduledAt: "2025-01-15T10:00:00Z",
    duration: 60,
    interviewer: { _id: "user-intw-001", name: "Bob Interviewer", email: "bob@test.com" },
    candidate: { _id: "user-cand-001", name: "Alice Candidate", email: "alice@test.com" },
    problems: [],
  },
  {
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
];

const MOCK_RESPONSE = {
  success: true,
  data: MOCK_INTERVIEWS_DATA,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

test.describe("Interview Dashboard", () => {
  test("candidate dashboard shows upcoming interviews", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
    );
    await page.goto("/interviews");
    await expect(page.getByText("Frontend Engineer Interview")).toBeVisible();
    await expect(page.getByText("Backend Systems Interview")).toBeVisible();
  });

  test("interview cards show status badges", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
    );
    await page.goto("/interviews");
    await expect(page.getByText(/scheduled/i).first()).toBeVisible();
    await expect(page.getByText(/completed/i).first()).toBeVisible();
  });

  test("candidate sees Join Interview button/link", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
    );
    await page.goto("/interviews");
    await expect(page.getByRole("link", { name: /join interview/i }).or(page.getByRole("button", { name: /join/i })).first()).toBeVisible();
  });

  test("interviewer sees Create Interview button/link", async ({ page }) => {
    await mockAuthMe(page, "interviewer");
    await loginAs(page, "interviewer");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
    );
    await page.goto("/interviews");
    await expect(page.getByRole("link", { name: /create interview/i }).or(page.getByRole("button", { name: /create/i })).first()).toBeVisible();
  });

  test("interview list shows empty state when no interviews", async ({ page }) => {
    await mockAuthMe(page, "candidate");
    await loginAs(page, "candidate");
    await page.route("**/api/interviews/my**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      })
    );
    await page.goto("/interviews");
    await expect(page.getByText(/no interviews|schedule|upcoming/i).first()).toBeVisible();
  });
});
