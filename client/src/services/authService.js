import api from "./api";

const authService ={
    register: async (userData) =>{
        const response = await api.post("/auth/register", userData,{
            headers: {
                "Content-Type": "multipart/form-data"
            },
        });
       
        return response.data;
    },

    login: async (userData) => {
        const response = await api.post("/auth/login",userData);
        return response.data;
    },

    getCurrentUser: async() =>{
        const response = await api.get("/auth/me");
        return response.data;
    }
};

export default authService;