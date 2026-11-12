import api from "./api";

const submissionService = {
  // Run only public example test cases.
  runExamples: async ({ problemId, language, code }) => {
    const response = await api.post("/submissions/run", {
      problemId,
      language,
      code,
    });

    return response.data;
  },

  // Submit a formal solution, optionally linked to an interview.
  submitSolution: async ({
    problemId,
    language,
    code,
    interviewId = null,
  }) => {
    const response = await api.post("/submissions/submit", {
      problemId,
      language,
      code,
      ...(interviewId ? { interviewId } : {}),
    });

    return response.data;
  },

  // Retrieve submissions.
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

  // Retrieve a particular submission.
  getSubmissionById: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },
};

export default submissionService;