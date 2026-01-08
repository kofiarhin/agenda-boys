// server/crawlers/myjoy/index.js
const nationalCrawler = require("./nationalCrawler");
const businessCrawler = require("./businessCrawler");
const politicsCrawler = require("./politicsCrawler");
const sportsCrawler = require("./sportsCrawler");

const runners = [
  ["politics", politicsCrawler],
  ["national", nationalCrawler],
  ["business", businessCrawler],
  ["sports", sportsCrawler],
];

const myJoyCrawler = async (opts = {}) => {
  console.log(
    JSON.stringify(
      { status: "RUNNERS", list: runners.map((r) => r[0]) },
      null,
      2
    )
  );

  for (const [name, fn] of runners) {
    const t0 = Date.now();

    console.log(
      JSON.stringify({ status: "RUNNER_START", runner: name }, null, 2)
    );

    try {
      await Promise.resolve(fn(opts));
      console.log(
        JSON.stringify(
          { status: "RUNNER_DONE", runner: name, ms: Date.now() - t0 },
          null,
          2
        )
      );
    } catch (err) {
      console.log(
        JSON.stringify(
          {
            status: "RUNNER_FAIL",
            runner: name,
            error: err?.message || String(err),
          },
          null,
          2
        )
      );
    }
  }

  console.log(JSON.stringify({ status: "ALL_RUNNERS_DONE" }, null, 2));
};

module.exports = myJoyCrawler;
