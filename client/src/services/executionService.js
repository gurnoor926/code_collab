
import api from "./api";

const executionService = {
  runCode: async ({ language, code, stdin }) => {
    const response = await api.post("/execution/run", {
      language,
      code,
      stdin,
    });

    return response.data;
  },

  getExecutionResult: async (token) => {
    const response = await api.get(`/execution/result/${token}`);
    return response.data;
  },
};

export default executionService;
