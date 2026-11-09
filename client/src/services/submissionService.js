
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

  getMySubmissions: async ({
    problemId,
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await api.get("/submissions/my", {
      params: {
        ...(problemId ? { problemId } : {}),
        page,
        limit,
      },
    });

    return response.data;
  },

  getSubmissionById: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },
};

export default submissionService;
