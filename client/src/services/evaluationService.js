
import api from "./api";

const evaluationService = {
  getEvaluation: async (interviewId) => {
    const response = await api.get(`/evaluations/${interviewId}`);
    return response.data;
  },
};

export default evaluationService;
