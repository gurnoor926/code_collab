
import api from "./api";

const problemService = {
  getProblems: async (params = {}) => {
    const response = await api.get("/problems", { params });
    return response.data;
  },

  getProblemById: async (problemId, params = {}) => {
    const response = await api.get(`/problems/${problemId}`, { params });
    return response.data;
  },

  createProblem: async (data) => {
    const response = await api.post("/problems", data);
    return response.data;
  },

  updateProblem: async (problemId, data) => {
    const response = await api.put(`/problems/${problemId}`, data);
    return response.data;
  },

  deleteProblem: async (problemId) => {
    const response = await api.delete(`/problems/${problemId}`);
    return response.data;
  },
};

export default problemService;
