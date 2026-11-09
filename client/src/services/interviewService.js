
import api from "./api";

const interviewService = {
  getMyInterviews: async ({ page = 1, limit = 50 } = {}) => {
    const response = await api.get("/interviews/my", {
      params: { page, limit },
    });

    return response.data;
  },
};

export default interviewService;
