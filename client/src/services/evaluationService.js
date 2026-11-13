
import api from "./api";

const evaluationService = {
  // Retrieve an interview evaluation and coding score.
  getEvaluation: async (interviewId) => {
    const response = await api.get(
      `/evaluations/${interviewId}`
    );

    return response.data;
  },

  // Submit interviewer ratings and feedback.
  submitEvaluation: async (interviewId, evaluationData) => {
    const response = await api.post(
      `/evaluations/${interviewId}/submit`,
      evaluationData
    );

    return response.data;
  },

  getEvaluationDashboard: async () => {
  const response = await api.get("/evaluations/dashboard");
  return response.data;
},
};

export default evaluationService;
