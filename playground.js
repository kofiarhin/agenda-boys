const aiWriter = require("./server/ai/aiWriter/aiWriter");

const run = async () => {
  const testData = {
    title: "City council approves new parking rules after months of debate",
    text: `The Riverside City Council voted 5-2 on Monday night to approve a new set of parking rules aimed at reducing congestion in the downtown area. The changes include extending metered parking hours from 6 p.m. to 9 p.m. on weekdays and introducing a tiered pricing system that charges higher rates during peak hours. Council members said the policy is intended to improve turnover for local businesses and encourage drivers to use public transport and nearby garages.

Several residents and business owners spoke during public comment. Some argued the extended hours would hurt workers who rely on street parking, while others said the city needs stronger enforcement to stop long-term parking. City officials said the new rules will take effect on March 1 and that enforcement will begin with a two-week warning period before tickets are issued. The council also directed staff to review the impact after six months and report back with recommendations.`,
  };

  const { title, summary, text } = await aiWriter(testData);
  console.log({ title, summary, text });
};

run();
