require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("../models/Problem");

// Test cases are plain stdin -> stdout pairs so they work against a real
// sandboxed execution service (Piston), not just pseudocode.
const problems = [
  {
    title: "Sum of Two Numbers",
    description:
      "Read two space-separated integers from standard input and print their sum.",
    difficulty: "Easy",
    inputFormat: "A single line: two integers separated by a space.",
    outputFormat: "A single integer: the sum.",
    constraints: "-10^9 <= a, b <= 10^9",
    sampleInput: "3 5",
    sampleOutput: "8",
    testCases: [
      { input: "3 5", output: "8", isHidden: false },
      { input: "10 20", output: "30", isHidden: true },
      { input: "-4 4", output: "0", isHidden: true },
    ],
  },
  {
    title: "Reverse a String",
    description: "Read a single line of text from standard input and print it reversed.",
    difficulty: "Easy",
    inputFormat: "A single line of text.",
    outputFormat: "The same text, reversed.",
    constraints: "1 <= length <= 10^5",
    sampleInput: "hello",
    sampleOutput: "olleh",
    testCases: [
      { input: "hello", output: "olleh", isHidden: false },
      { input: "battle", output: "elttab", isHidden: true },
    ],
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const p of problems) {
    const existing = await Problem.findOne({ title: p.title });
    if (existing) {
      console.log(`Skipping "${p.title}" (already exists)`);
      continue;
    }
    await Problem.create(p);
    console.log(`Created "${p.title}"`);
  }

  await mongoose.disconnect();
};

run()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
