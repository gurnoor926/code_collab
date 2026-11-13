import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CandidateScorecard from "../CandidateScorecard";

vi.mock("../../../services/interviewService", () => ({
  default: {
    getInterviewById: vi.fn(),
  },
}));

vi.mock("../../../services/evaluationService", () => ({
  default: {
    getEvaluation: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

import interviewService from "../../../services/interviewService";
import evaluationService from "../../../services/evaluationService";

function renderScorecard(interviewId = "int-101") {
  return render(
    <MemoryRouter initialEntries={[`/interviews/${interviewId}/scorecard`]}>
      <Routes>
        <Route path="/interviews/:id/scorecard" element={<CandidateScorecard />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CandidateScorecard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays scorecard unavailable when evaluation has not been submitted", async () => {
    interviewService.getInterviewById.mockResolvedValueOnce({
      data: { _id: "int-101", title: "Full Stack Round" },
    });
    evaluationService.getEvaluation.mockResolvedValueOnce({
      data: { evaluation: null },
    });

    renderScorecard();

    expect(await screen.findByText(/scorecard unavailable/i)).toBeInTheDocument();
  });

  it("renders scorecard metrics and recommendation when evaluation is submitted", async () => {
    interviewService.getInterviewById.mockResolvedValueOnce({
      data: {
        _id: "int-101",
        title: "Full Stack Round",
        candidate: { name: "Bob Smith", email: "bob@example.com" },
        interviewer: { name: "Alice Senior" },
      },
    });

    evaluationService.getEvaluation.mockResolvedValueOnce({
      data: {
        evaluation: {
          status: "submitted",
          recommendation: "strong_hire",
          overallScore: 88,
          interviewerScore: 90,
          technicalSkills: 5,
          problemSolving: 4,
          communication: 5,
          codeQuality: 4,
          notes: "Outstanding algorithmic and architecture discussion.",
          strengths: ["Fast implementation", "Good edge case testing"],
        },
        coding: {
          codingScore: 85,
        },
      },
    });

    renderScorecard();

    expect(await screen.findByText("Candidate Scorecard")).toBeInTheDocument();
    expect(screen.getAllByText("Strong Hire").length).toBeGreaterThan(0);
    expect(screen.getByText("88.00")).toBeInTheDocument();
    expect(screen.getByText("Technical Skills")).toBeInTheDocument();
    expect(screen.getByText("Problem Solving")).toBeInTheDocument();
    expect(screen.getByText("Fast implementation")).toBeInTheDocument();
  });
});
