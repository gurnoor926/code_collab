const axios = require("axios");

const JUDGE0_API_URL = process.env.JUDGE0_API_URL;

if (!JUDGE0_API_URL) {
    throw new Error("JUDGE0_API_URL is not configured");
}

const languageIds = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
};

const judge0Client = axios.create({
    baseURL: JUDGE0_API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

const handleJudge0Error = (error) => {
    if (error.response) {
        const judge0Error = new Error(
            `Judge0 API returned status ${error.response.status}`
        );

        judge0Error.statusCode = error.response.status;
        judge0Error.originalError = error;

        throw judge0Error;
    }

    if (error.code === "ECONNABORTED") {
        const timeoutError = new Error("Judge0 request timed out");
        timeoutError.code = "JUDGE0_TIMEOUT";
        throw timeoutError;
    }

    const networkError = new Error("Unable to connect to Judge0");
    networkError.code = "JUDGE0_NETWORK_ERROR";

    throw networkError;
};

const submitCode = async ({ language, code, stdin = "" }) => {
    const languageId = languageIds[language];

    if (!languageId) {
        throw new Error("Unsupported programming language");
    }

    try {
        const response = await judge0Client.post(
            "/submissions",
            {
                language_id: languageId,
                source_code: code,
                stdin,
            },
            {
                params: {
                    base64_encoded: "false",
                    wait: "false",
                },
            }
        );

        return response.data;

    } catch (error) {
        handleJudge0Error(error);
    }
};

const getSubmissionResult = async (token) => {
    try {
        const response = await judge0Client.get(
            `/submissions/${encodeURIComponent(token)}`,
            {
                params: {
                    base64_encoded: "false",
                    fields: [
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

    } catch (error) {
        handleJudge0Error(error);
    }
};

module.exports = {
    submitCode,
    getSubmissionResult,
};