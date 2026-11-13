/**
 * Shared Playwright auth helpers for CodeCollab E2E tests.
 *
 * Usage:
 *   import { loginAs, mockAuthMe } from './helpers/auth.js';
 *
 *   test('...', async ({ page }) => {
 *     await mockAuthMe(page, 'candidate');
 *     await loginAs(page, 'candidate');
 *     await page.goto('/dashboard');
 *   });
 */

/** Fake JWT stored in localStorage to pass ProtectedRoute checks */
const FAKE_TOKEN = "fake-test-jwt-token";

/** Sample users per role */
const USERS = {
  candidate: {
    _id: "user-cand-001",
    name: "Alice Candidate",
    email: "alice@test.com",
    role: "candidate",
    createdAt: "2024-01-01T00:00:00Z",
  },
  interviewer: {
    _id: "user-intw-001",
    name: "Bob Interviewer",
    email: "bob@test.com",
    role: "interviewer",
    createdAt: "2024-01-01T00:00:00Z",
  },
  admin: {
    _id: "user-admn-001",
    name: "Carol Admin",
    email: "carol@test.com",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
};

/**
 * Inject a fake token + user into localStorage before the page loads.
 * Must be called before page.goto().
 */
export async function loginAs(page, role = "candidate") {
  const user = USERS[role];
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { token: FAKE_TOKEN, user }
  );
}

/**
 * Mock GET /auth/me to return the given role's user.
 * Must be called before page.goto().
 */
export async function mockAuthMe(page, role = "candidate") {
  const user = USERS[role];
  await page.route("**/api/auth/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: user }),
    });
  });
  // Also mock notifications unread count (used by Navbar)
  await page.route("**/api/notifications/unread-count", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { unreadCount: 0 } }),
    });
  });
}

export { FAKE_TOKEN, USERS };

