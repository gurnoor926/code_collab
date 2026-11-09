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
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await judge0Client.post(
      "/submissions",
      {
        language_id: languageId,
        source_code: Buffer.from(code, "utf8").toString("base64"),
        stdin: Buffer.from(stdin, "utf8").toString("base64"),
      },
      {
        params: {
          base64_encoded: "true",
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
      `/submissions/${token}`,
      {
        params: {
          base64_encoded: "true",
          fields:
            "token,stdout,stderr,compile_output,message,status,time,memory",
        },
      }
    );

    const result = response.data;

    return {
      ...result,
      stdout: result.stdout
        ? Buffer.from(result.stdout, "base64").toString("utf8")
        : null,
      stderr: result.stderr
        ? Buffer.from(result.stderr, "base64").toString("utf8")
        : null,
      compile_output: result.compile_output
        ? Buffer.from(result.compile_output, "base64").toString("utf8")
        : null,
      message: result.message
        ? Buffer.from(result.message, "base64").toString("utf8")
        : null,
    };
  } catch (error) {
    handleJudge0Error(error);
  }
};

module.exports = {
    submitCode,
    getSubmissionResult,
};