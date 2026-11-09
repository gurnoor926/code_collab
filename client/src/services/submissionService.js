import api from "./api";

const submissionService = {
  runExamples: async ({ problemId, language, code }) => {
    const response = await api.post("/submissions/run", {
      problemId,
      language,
      code,
    });

    return response.data;
  },

  submitSolution: async ({ problemId, language, code }) => {
    const response = await api.post("/submissions/submit", {
      problemId,
      language,
      code,
    });

    return response.data;
  },
};

export default submissionService;