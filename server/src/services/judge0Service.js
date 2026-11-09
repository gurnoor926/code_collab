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
    console.error("Judge0 API Error:", {
      status: error.response.status,
      data: error.response.data,
    });

    const judge0Error = new Error(
      `Judge0 API returned status ${error.response.status}`
    );

    judge0Error.statusCode = error.response.status;
    judge0Error.judge0Response = error.response.data;

    throw judge0Error;
  }

  if (error.code === "ECONNABORTED") {
    throw new Error("Judge0 API request timed out");
  }

  throw new Error(
    `Judge0 network error: ${error.message}`
  );
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