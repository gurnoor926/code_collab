module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};