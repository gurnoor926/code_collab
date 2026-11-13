import api from "./api";

const replayService = {
  getReplayEvents: async (interviewId, params = {}) => {
    const response = await api.get(`/replays/${interviewId}/events`, {
      params,
    });
    return response.data;
  },

  startReplay: async (interviewId, data = {}) => {
    const response = await api.post(`/replays/${interviewId}/start`, data);
    return response.data;
  },

  recordCodeChange: async (interviewId, data) => {
    const response = await api.post(
      `/replays/${interviewId}/code-change`,
      data
    );
    return response.data;
  },

  recordLanguageChange: async (interviewId, data) => {
    const response = await api.post(
      `/replays/${interviewId}/language-change`,
      data
    );
    return response.data;
  },

  createSnapshot: async (interviewId, data) => {
    const response = await api.post(
      `/replays/${interviewId}/snapshot`,
      data
    );
    return response.data;
  },

  completeReplay: async (interviewId) => {
    const response = await api.patch(`/replays/${interviewId}/complete`);
    return response.data;
  },
};

export default replayService;

