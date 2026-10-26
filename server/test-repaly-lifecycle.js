require("dotenv").config();

const mongoose = require("mongoose");

const {
  startReplay,
  recordCodeChange,
  recordLanguageChange,
  getReplayEvents,
  completeReplay,
} = require("./src/services/replayService");

async function main() {
  const interviewId = process.argv[2];
  const userId = process.argv[3];

  if (!interviewId || !userId) {
    throw new Error(
      "Usage: node test-replay-lifecycle.js INTERVIEW_ID USER_ID"
    );
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("\n1. Starting replay...");

    const session = await startReplay({
      interviewId,
      initialCode: "console.log('Start');",
      initialLanguage: "javascript",
    });

    console.log("Replay status:", session.status);

    console.log("\n2. Recording code change...");

    await recordCodeChange({
      interviewId,
      userId,
      code: "console.log('Updated');",
      language: "javascript",
    });

    console.log("Code change recorded.");

    console.log("\n3. Recording language change...");

    await recordLanguageChange({
      interviewId,
      userId,
      language: "python",
    });

    console.log("Language change recorded.");

    console.log("\n4. Retrieving replay events...");

    const replay = await getReplayEvents({
      interviewId,
      afterSequence: 0,
      limit: 100,
    });

    console.log("\n4. Testing replay pagination...");

const firstPage = await getReplayEvents({
  interviewId,
  afterSequence: 0,
  limit: 2,
});

console.log(
  "First page sequences:",
  firstPage.events.map((event) => event.sequence),
);

console.log("Next sequence:", firstPage.nextAfterSequence);
console.log("Has more events:", firstPage.hasMore);

const secondPage = await getReplayEvents({
  interviewId,
  afterSequence: firstPage.nextAfterSequence,
  limit: 2,
});

console.log(
  "Second page sequences:",
  secondPage.events.map((event) => event.sequence),
);
    

    console.log(
      "Event sequence:",
      replay.events.map((event) => event.sequence)
    );

    console.log("Total events returned:", replay.events.length);

    console.log("\n5. Completing replay...");

    const completedSession = await completeReplay(interviewId);

    console.log("Final status:", completedSession.status);
    console.log("Ended at:", completedSession.endedAt);

    console.log("\n6. Verifying that recording has stopped...");

    try {
      await recordCodeChange({
        interviewId,
        userId,
        code: "console.log('Should not be recorded');",
        language: "javascript",
      });

      throw new Error(
        "FAIL: A code change was accepted after replay completion."
      );
    } catch (error) {
      if (
        error.message ===
        "FAIL: A code change was accepted after replay completion."
      ) {
        throw error;
      }

      console.log("PASS:", error.message);
    }

    console.log("\nReplay lifecycle test completed successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("\nReplay lifecycle test failed:", error.message);
  process.exitCode = 1;
});