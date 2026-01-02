// playground.js
require("dotenv").config();

const summaryGenerator = require("./server/ai/summaryGenerator");
const testModule = require("./server/tests/testData");

// if your test file exports { testNewsDataset }
const testDataset = testModule.testNewsDataset || testModule;

(async () => {
  console.log("HF key present?", !!process.env.HUGGING_FACE_API_KEY);
  console.log(
    "dataset is array?",
    Array.isArray(testDataset),
    "len:",
    testDataset?.length
  );

  const result = await summaryGenerator(testDataset);
  console.dir(result, { depth: null });
})().catch((err) => {
  console.error("RUN ERROR:", err);
});
