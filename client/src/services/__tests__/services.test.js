import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from "../api";
import authService from "../authService";
import problemService from "../problemService";
import replayService from "../replayService";
import interviewService from "../interviewService";
import submissionService from "../submissionService";
import executionService from "../executionService";
import evaluationService from "../evaluationService";
import notificationService from "../notificationService";

describe("API Services Full Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authService", () => {
    it("calls /auth/login with credentials and returns data", async () => {
      const mockResponse = { data: { token: "fake-jwt", user: { id: "1" } } };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({ email: "user@test.com", password: "123" });
      expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "user@test.com", password: "123" });
      expect(result).toEqual(mockResponse.data);
    });

    it("propagates error on failed login", async () => {
      api.post.mockRejectedValueOnce(new Error("Network Error"));
      await expect(authService.login({ email: "bad@test.com" })).rejects.toThrow("Network Error");
    });

    it("calls /auth/me to retrieve current user profile", async () => {
      const mockResponse = { data: { user: { id: "1", name: "Alice" } } };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.getCurrentUser();
      expect(api.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("problemService", () => {
    it("fetches problems with query filters", async () => {
      const mockData = { problems: [{ title: "Two Sum", difficulty: "Easy" }] };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await problemService.getProblems({ difficulty: "Easy" });
      expect(api.get).toHaveBeenCalledWith("/problems", { params: { difficulty: "Easy" } });
      expect(result).toEqual(mockData);
    });

    it("fetches single problem by id", async () => {
      const mockData = { problem: { _id: "prob-1", title: "Two Sum" } };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await problemService.getProblemById("prob-1");
      expect(api.get).toHaveBeenCalledWith("/problems/prob-1", { params: {} });
      expect(result).toEqual(mockData);
    });
  });

  describe("replayService", () => {
    it("fetches replay events for an interview", async () => {
      const mockEvents = { events: [{ type: "code_change", timestamp: 100 }] };
      api.get.mockResolvedValueOnce({ data: mockEvents });

      const result = await replayService.getReplayEvents("interview-10");
      expect(api.get).toHaveBeenCalledWith("/replays/interview-10/events", { params: {} });
      expect(result).toEqual(mockEvents);
    });

    it("records a code change event", async () => {
      const payload = { code: "const x = 10;", language: "javascript" };
      api.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await replayService.recordCodeChange("interview-10", payload);
      expect(api.post).toHaveBeenCalledWith("/replays/interview-10/code-change", payload);
      expect(result).toEqual({ success: true });
    });
  });

  describe("interviewService", () => {
    it("fetches interviews for current user", async () => {
      const mockInterviews = { data: [{ _id: "int-1", title: "Frontend Round" }] };
      api.get.mockResolvedValueOnce({ data: mockInterviews });

      const result = await interviewService.getMyInterviews({ page: 1, limit: 10 });
      expect(api.get).toHaveBeenCalledWith("/interviews/my", { params: { page: 1, limit: 10 } });
      expect(result).toEqual(mockInterviews);
    });

    it("joins interview with sanitized room code", async () => {
      api.post.mockResolvedValueOnce({ data: { success: true, interviewId: "int-1" } });

      const result = await interviewService.joinInterview(" cc-abc12345 ");
      expect(api.post).toHaveBeenCalledWith("/interviews/join", { roomCode: "CC-ABC12345" });
      expect(result).toEqual({ success: true, interviewId: "int-1" });
    });

    it("starts and completes interview via PATCH endpoints", async () => {
      api.patch.mockResolvedValueOnce({ data: { status: "active" } });
      const started = await interviewService.startInterview("int-1");
      expect(api.patch).toHaveBeenCalledWith("/interviews/int-1/start");
      expect(started).toEqual({ status: "active" });

      api.patch.mockResolvedValueOnce({ data: { status: "completed" } });
      const completed = await interviewService.completeInterview("int-1");
      expect(api.patch).toHaveBeenCalledWith("/interviews/int-1/complete");
      expect(completed).toEqual({ status: "completed" });
    });
  });

  describe("executionService", () => {
    it("submits code to execution run endpoint", async () => {
      api.post.mockResolvedValueOnce({ data: { token: "judge-token-xyz" } });
      const res = await executionService.runCode({ language: "javascript", code: "console.log(1);" });
      expect(api.post).toHaveBeenCalledWith("/execution/run", {
        language: "javascript",
        code: "console.log(1);",
        stdin: "",
      });
      expect(res).toEqual({ token: "judge-token-xyz" });
    });

    it("polls execution result endpoint by token", async () => {
      api.get.mockResolvedValueOnce({ data: { stdout: "1\n", status: { id: 3, description: "Accepted" } } });
      const res = await executionService.getExecutionResult("judge-token-xyz");
      expect(api.get).toHaveBeenCalledWith("/execution/result/judge-token-xyz");
      expect(res.stdout).toBe("1\n");
    });
  });

  describe("submissionService", () => {
    it("runs public examples", async () => {
      api.post.mockResolvedValueOnce({ data: { passed: 2, total: 2 } });
      const res = await submissionService.runExamples({ problemId: "p1", language: "python", code: "pass" });
      expect(api.post).toHaveBeenCalledWith("/submissions/run", {
        problemId: "p1",
        language: "python",
        code: "pass",
      });
      expect(res).toEqual({ passed: 2, total: 2 });
    });

    it("submits formal solution linked to interview", async () => {
      api.post.mockResolvedValueOnce({ data: { status: "accepted", passedTestCases: 5 } });
      const res = await submissionService.submitSolution({
        problemId: "p1",
        language: "cpp",
        code: "int main() {}",
        interviewId: "int-42",
      });
      expect(api.post).toHaveBeenCalledWith("/submissions/submit", {
        problemId: "p1",
        language: "cpp",
        code: "int main() {}",
        interviewId: "int-42",
      });
      expect(res.status).toBe("accepted");
    });
  });

  describe("evaluationService", () => {
    it("submits interview evaluation ratings", async () => {
      const evaluationPayload = {
        technicalScore: 9,
        problemSolvingScore: 8,
        communicationScore: 9,
        feedback: "Excellent algorithmic skills.",
      };
      api.post.mockResolvedValueOnce({ data: { success: true } });

      const res = await evaluationService.submitEvaluation("int-1", evaluationPayload);
      expect(api.post).toHaveBeenCalledWith("/evaluations/int-1/submit", evaluationPayload);
      expect(res).toEqual({ success: true });
    });

    it("retrieves evaluation scorecard", async () => {
      api.get.mockResolvedValueOnce({ data: { evaluation: { technicalScore: 9 } } });
      const res = await evaluationService.getEvaluation("int-1");
      expect(api.get).toHaveBeenCalledWith("/evaluations/int-1");
      expect(res.evaluation.technicalScore).toBe(9);
    });
  });

  describe("notificationService", () => {
    it("fetches unread count and marks notifications as read", async () => {
      api.get.mockResolvedValueOnce({ data: { count: 3 } });
      const countRes = await notificationService.getUnreadCount();
      expect(api.get).toHaveBeenCalledWith("/notifications/unread-count");
      expect(countRes.count).toBe(3);

      api.patch.mockResolvedValueOnce({ data: { success: true } });
      const readRes = await notificationService.markAsRead("notif-1");
      expect(api.patch).toHaveBeenCalledWith("/notifications/notif-1/read");
      expect(readRes.success).toBe(true);
    });
  });
});
