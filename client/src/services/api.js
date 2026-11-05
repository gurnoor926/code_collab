import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers:{
        "Content-Type": "application/json",
    },
    timeout: 30000, // Set a timeout of 30 seconds
});
//attach the JWT token to the protected requests

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if(token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error)
);
export default api;