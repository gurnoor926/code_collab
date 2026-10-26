require("dotenv").config();

const mongoose = require("mongoose");
const {
    startReplay,
    recordCodeChange,
    recordLanguageChange,
    getReplayEvents,
} = require("./src/services/replayService");

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const interviewId = process.argv[2];
        const userId = process.argv[3];

        if (!interviewId || !userId) {
            throw new Error(
                "Usage: node test-replay-service.js INTERVIEW_ID USER_ID"
            );
        }

        await startReplay({
            interviewId,
            initialCode: "",
            initialLanguage: "javascript",
        });

        await recordCodeChange({
            interviewId,
            userId,
            code: "console.log('Hello CodeCollab');",
            language: "javascript",
        });

        await recordLanguageChange({
            interviewId,
            userId,
            language: "python",
        });

        const replay = await getReplayEvents({
            interviewId,
            afterSequence: 0,
            limit: 100,
        });

        console.log(JSON.stringify(replay, null, 2));
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error("Replay test failed:", error.message);
    process.exitCode = 1;
});