
import { useCallback, useState } from "react";
import executionService from "../services/executionService";

const POLL_INTERVAL = 1500;
const MAX_ATTEMPTS = 30;

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function useCodeExecution() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runCode = useCallback(async ({ language, code, stdin }) => {
    if (!code.trim()) {
      setError("Please write some code before running.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Step 1: Submit code to backend
      const submission = await executionService.runCode({
        language,
        code,
        stdin,
      });

      const token = submission.data?.token;

      if (!token) {
        throw new Error("Execution token was not returned by the server.");
      }

      // Step 2: Poll Judge0 result
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        await delay(POLL_INTERVAL);

        const response =
          await executionService.getExecutionResult(token);

        const execution = response.data;

        if (!execution?.status) {
          throw new Error("Invalid execution response from server.");
        }

        const statusId = execution.status.id;

        // Judge0 status IDs 1 and 2 are non-terminal.
        if (statusId === 1 || statusId === 2) {
          continue;
        }

        // Execution finished
        setResult(execution);
        setLoading(false);
        return execution;
      }

      throw new Error(
        "Execution is taking too long. Please try again."
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Code execution failed.";

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = () => {
    setResult(null);
    setError("");
  };

  return {
    runCode,
    loading,
    result,
    error,
    clearResult,
  };
}

export default useCodeExecution;
