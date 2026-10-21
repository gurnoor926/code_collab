const axios = require("axios");
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
const languageIds = {
    javascript:63,
    python:71,
    cpp:54,
    java:62,
};

const judge0Client = axios.create({
    baseURL: JUDGE0_API_URL,
    timeout:15000,
    headers:{
        "Content-Type":"application/json",
    },
});

const submitCode = async ({ language , code , stdin = ""}) =>{
    const languageId = languageIds[language];

    if(!languageId){
        throw new Error("Unsupported programming language");
    }

    const response = await judge0Client.post(
        "/submissions",
        {
            language_id:languageId,
            source_code:code,
            stdin,
        },
        {
            params:{
                base64_encoded:"false",
                wait:"false",
            },
        },
    );

    return response.data;
};

const getSubmissionResult = async (token) =>{
    const response = await judge0Client.get(
        `/submissions/${encodeURIComponent(token)}`,
        {
            params:{
                base64_encoded:"false",
                fields:[
                    "token",
                    "stdout",
                    "stderr",
                    "compile_output",
                    "message",
                    "status",
                    "time",
                    "memory",
                ].join(","),
            },
        }
    );

    return response.data;
};

module.exports ={
    submitCode,
    getSubmissionResult,
};