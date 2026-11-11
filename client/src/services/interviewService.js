
import api from "./api";

const interviewService = {
  getMyInterviews: async ({ page = 1, limit = 50 } = {}) => {
    const response = await api.get("/interviews/my", {
      params: { page, limit },
    });

    return response.data;
  },

  createInterview: async (interviewData) => {
    const response = await api.post("/interviews", interviewData);
    return response.data;
  },
  joinInterview: async (roomCode) => {
  const response = await api.post("/interviews/join", {
    roomCode: roomCode.trim().toUpperCase(),
  });

  return response.data;
},

getInterviewById: async (interviewId) => {
  const response = await api.get(`/interviews/${interviewId}`);
  return response.data;
},

startInterview: async (interviewId) => {
  const response = await api.patch(`/interviews/${interviewId}/start`);
  return response.data;
},

cancelInterview: async (interviewId) => {
  const response = await api.patch(`/interviews/${interviewId}/cancel`);
  return response.data;
},

completeInterview: async (interviewId) => {
  const response = await api.patch(`/interviews/${interviewId}/complete`);
  return response.data;
},

};

export default interviewService;
