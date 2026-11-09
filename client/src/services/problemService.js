
import api from "./api";

const problemService = {
  getProblems: async (params = {}) => {
    const response = await api.get("/problems", { params });
    return response.data;
  },

  getProblemById: async (problemId) => {
    const response = await api.get(`/problems/${problemId}`);
    return response.data;
  },
};

export default problemService;
