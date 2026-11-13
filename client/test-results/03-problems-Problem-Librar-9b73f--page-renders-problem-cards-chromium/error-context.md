# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-problems.spec.js >> Problem Library >> problem library page renders problem cards
- Location: tests\e2e\03-problems.spec.js:68:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Two Sum')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Two Sum') with timeout 10000ms
  - waiting for getByText('Two Sum')

```

```yaml
- link "CodeCollab":
  - /url: /
- text: Collaborative coding starts here
- heading "Think together. Code together. Succeed together." [level=1]
- paragraph: A collaborative space for technical interviews, coding challenges and real-time problem solving.
- heading "Powerful coding workspace" [level=3]
- paragraph: Write and execute code in multiple languages.
- heading "Real-time collaboration" [level=3]
- paragraph: Work together in a shared interview room.
- heading "Structured evaluations" [level=3]
- paragraph: Track performance with interview scorecards.
- paragraph: © 2026 CodeCollab. Built for better technical interviews.
- heading "Welcome back" [level=2]
- paragraph: Sign in to continue to your CodeCollab workspace.
- text: Email address
- textbox "Email address":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
- button "Show password"
- button "Sign in"
- text: NEW TO CODECOLLAB?
- paragraph:
  - text: Don't have an account?
  - link "Create account":
    - /url: /register
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { loginAs, mockAuthMe } from "./helpers/auth.js";
  3   | 
  4   | const MOCK_PROBLEMS = {
  5   |   success: true,
  6   |   data: [
  7   |     {
  8   |       _id: "prob-001",
  9   |       title: "Two Sum",
  10  |       difficulty: "Easy",
  11  |       category: "Arrays",
  12  |       tags: ["array", "hash-table"],
  13  |       isPublished: true,
  14  |     },
  15  |     {
  16  |       _id: "prob-002",
  17  |       title: "Longest Substring",
  18  |       difficulty: "Medium",
  19  |       category: "Strings",
  20  |       tags: ["sliding-window"],
  21  |       isPublished: true,
  22  |     },
  23  |     {
  24  |       _id: "prob-003",
  25  |       title: "Median of Arrays",
  26  |       difficulty: "Hard",
  27  |       category: "Binary Search",
  28  |       tags: ["binary-search"],
  29  |       isPublished: true,
  30  |     },
  31  |   ],
  32  |   pagination: { page: 1, limit: 9, total: 3, totalPages: 1 },
  33  | };
  34  | 
  35  | const MOCK_PROBLEM_DETAIL = {
  36  |   success: true,
  37  |   data: {
  38  |     _id: "prob-001",
  39  |     title: "Two Sum",
  40  |     description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  41  |     difficulty: "Easy",
  42  |     category: "Arrays",
  43  |     constraints: "2 <= nums.length <= 10^4",
  44  |     examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" }],
  45  |     supportedLanguages: ["javascript", "python", "cpp", "java"],
  46  |     timeLimit: 1000,
  47  |     memoryLimit: 256,
  48  |     tags: ["array"],
  49  |     isPublished: true,
  50  |     starterCode: { javascript: "function twoSum(nums, target) {\n  // your code\n}", python: "def twoSum(nums, target):\n    pass" },
  51  |   },
  52  | };
  53  | 
  54  | test.describe("Problem Library", () => {
  55  |   test.beforeEach(async ({ page }) => {
  56  |     await mockAuthMe(page, "candidate");
  57  |     await loginAs(page, "candidate");
  58  |     await page.route("**/api/problems**", (route) => {
  59  |       const url = route.request().url();
  60  |       if (url.match(/problems\/prob-001/)) {
  61  |         route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEM_DETAIL) });
  62  |       } else {
  63  |         route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PROBLEMS) });
  64  |       }
  65  |     });
  66  |   });
  67  | 
  68  |   test("problem library page renders problem cards", async ({ page }) => {
  69  |     await page.goto("/problems");
> 70  |     await expect(page.getByText("Two Sum")).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  71  |     await expect(page.getByText("Longest Substring")).toBeVisible();
  72  |     await expect(page.getByText("Median of Arrays")).toBeVisible();
  73  |   });
  74  | 
  75  |   test("difficulty badges are visible", async ({ page }) => {
  76  |     await page.goto("/problems");
  77  |     await expect(page.getByText("Easy").first()).toBeVisible();
  78  |     await expect(page.getByText("Medium").first()).toBeVisible();
  79  |     await expect(page.getByText("Hard").first()).toBeVisible();
  80  |   });
  81  | 
  82  |   test("search input exists and is typeable", async ({ page }) => {
  83  |     await page.goto("/problems");
  84  |     const searchInput = page.getByPlaceholder(/search/i);
  85  |     await expect(searchInput).toBeVisible();
  86  |     await searchInput.fill("Two Sum");
  87  |     await expect(searchInput).toHaveValue("Two Sum");
  88  |   });
  89  | 
  90  |   test("difficulty filter buttons exist", async ({ page }) => {
  91  |     await page.goto("/problems");
  92  |     await expect(page.getByRole("button", { name: /easy/i }).first()).toBeVisible();
  93  |     await expect(page.getByRole("button", { name: /medium/i }).first()).toBeVisible();
  94  |     await expect(page.getByRole("button", { name: /hard/i }).first()).toBeVisible();
  95  |   });
  96  | 
  97  |   test("clicking a problem navigates to /problems/:id", async ({ page }) => {
  98  |     await page.goto("/problems");
  99  |     await page.getByText("Two Sum").first().click();
  100 |     await expect(page).toHaveURL(/\/problems\/prob-001/);
  101 |   });
  102 | 
  103 |   test("problem detail page renders title and difficulty badge", async ({ page }) => {
  104 |     await page.goto("/problems/prob-001");
  105 |     await expect(page.getByText("Two Sum")).toBeVisible();
  106 |     await expect(page.getByText("Easy").first()).toBeVisible();
  107 |   });
  108 | 
  109 |   test("problem detail page renders description", async ({ page }) => {
  110 |     await page.goto("/problems/prob-001");
  111 |     await expect(page.getByText(/return indices/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   test("Monaco editor container renders on problem detail", async ({ page }) => {
  115 |     await page.goto("/problems/prob-001");
  116 |     // Monaco editor DOM element
  117 |     const editor = page.locator(".monaco-editor, [data-keybinding-context]");
  118 |     await expect(editor.first()).toBeVisible({ timeout: 15000 });
  119 |   });
  120 | 
  121 |   test("language selector exists on problem detail", async ({ page }) => {
  122 |     await page.goto("/problems/prob-001");
  123 |     await expect(page.getByRole("combobox").first().or(page.getByText(/javascript|python/i).first())).toBeVisible();
  124 |   });
  125 | 
  126 |   test("Run and Submit buttons exist on problem detail", async ({ page }) => {
  127 |     await page.goto("/problems/prob-001");
  128 |     await expect(page.getByRole("button", { name: /run/i }).first()).toBeVisible();
  129 |     await expect(page.getByRole("button", { name: /submit/i }).first()).toBeVisible();
  130 |   });
  131 | });
  132 | 
```