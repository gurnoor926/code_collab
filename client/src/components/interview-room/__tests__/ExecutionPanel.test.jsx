import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ExecutionPanel from "../ExecutionPanel";

describe("ExecutionPanel Component", () => {
  it("renders empty state when no result is present", () => {
    render(<ExecutionPanel result={null} loading={false} error="" />);

    expect(screen.getByText("Execution Console")).toBeInTheDocument();
    expect(screen.getByText("No execution results yet")).toBeInTheDocument();
  });

  it("renders loading state while executing code", () => {
    render(<ExecutionPanel result={null} loading={true} error="" mode="run" />);

    expect(screen.getByText(/Executing your code\.\.\./i)).toBeInTheDocument();
  });

  it("renders error alert when error prop is passed", () => {
    render(<ExecutionPanel result={null} loading={false} error="Compilation error: undefined identifier" />);

    expect(screen.getByText(/Execution failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Compilation error: undefined identifier/i)).toBeInTheDocument();
  });

  it("displays test case breakdown and execution metrics upon completion", () => {
    const mockResult = {
      status: "Accepted",
      totalTestCases: 3,
      passedTestCases: 3,
      executionTime: 45,
      memoryUsed: 1024,
      results: [
        { testCaseNumber: 1, passed: true, input: "[2,7,11,15], 9", expectedOutput: "[0,1]", actualOutput: "[0,1]" },
        { testCaseNumber: 2, passed: true, input: "[3,2,4], 6", expectedOutput: "[1,2]", actualOutput: "[1,2]" },
        { testCaseNumber: 3, passed: true, input: "[3,3], 6", expectedOutput: "[0,1]", actualOutput: "[0,1]" },
      ],
    };

    render(<ExecutionPanel result={mockResult} loading={false} error="" mode="submit" />);

    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("45 ms")).toBeInTheDocument();
    expect(screen.getByText(/Memory:\s*1024 KB/i)).toBeInTheDocument();
    expect(screen.getByText("Test Case 1")).toBeInTheDocument();
    expect(screen.getByText("Test Case 2")).toBeInTheDocument();
    expect(screen.getByText("Test Case 3")).toBeInTheDocument();
  });
});
