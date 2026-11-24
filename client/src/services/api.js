
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("VITE_API_URL is not configured.");
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

let logoutDispatched = false;
let activeRequestsCount = 0;
const loadingListeners = new Set();

const notifyLoadingListeners = () => {
  const isLoading = activeRequestsCount > 0;
  loadingListeners.forEach((listener) => {
    try {
      listener(isLoading, activeRequestsCount);
    } catch (e) {
      console.error("API loading listener error:", e);
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("api:loading", {
        detail: { isLoading, activeCount: activeRequestsCount },
      })
    );
  }
};

export const subscribeToApiLoading = (listener) => {
  loadingListeners.add(listener);
  listener(activeRequestsCount > 0, activeRequestsCount);
  return () => {
    loadingListeners.delete(listener);
  };
};

export const getApiLoadingState = () => ({
  isLoading: activeRequestsCount > 0,
  activeCount: activeRequestsCount,
});

// Reset logout state after successful authentication.
export const resetApiLogoutState = () => {
  logoutDispatched = false;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    activeRequestsCount++;
    notifyLoadingListeners();

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.set(
        "Authorization",
        `Bearer ${token}`,
      );
    } else {
      config.headers.delete("Authorization");
    }

    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    } else {
      config.headers.set(
        "Content-Type",
        "application/json",
      );
    }

    return config;
  },
  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyLoadingListeners();
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyLoadingListeners();
    return response;
  },

  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyLoadingListeners();

    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    // Handle unauthorized requests.
    if (status === 401 && !isAuthRequest) {
      const token = localStorage.getItem("token");

      if (token && !logoutDispatched) {
        logoutDispatched = true;

        localStorage.removeItem("token");

        window.dispatchEvent(
          new Event("auth:logout"),
        );
      }
    }

    // Consistent error messages.
    if (error.code === "ECONNABORTED") {
      error.userMessage =
        "The request timed out. Please try again.";
    } else if (!error.response) {
      error.userMessage =
        "Unable to connect to the server. Check your internet connection.";
    } else if (status >= 500) {
      error.userMessage =
        "Server error. Please try again later.";
    } else if (status === 403) {
      error.userMessage =
        "You do not have permission to perform this action.";
    } else if (status === 404) {
      error.userMessage =
        "The requested resource was not found.";
    } else if (status === 429) {
      error.userMessage =
        "Too many requests. Please try again later.";
    } else {
      error.userMessage =
        error.response.data?.message ||
        "Something went wrong. Please try again.";
    }

    return Promise.reject(error);
  },
);

export default api;
