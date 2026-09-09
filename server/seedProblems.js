require("dotenv").config();

const mongoose = require("mongoose");
const Problem = require("./models/Problem");

const problems = [
  {
    title: "Two Sum",
    description:
      "Given an array of integers and a target integer, return the indices of the two numbers such that they add up to the target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated integers. The third line contains the target integer.",
    outputFormat:
      "Print the two zero-based indices of the numbers whose sum equals the target.",
    constraints:
      "2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.",
    sampleInput: "4\n2 7 11 15\n9",
    sampleOutput: "0 1",
    testCases: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        isHidden: false,
      },
      {
        input: "3\n3 2 4\n6",
        output: "1 2",
        isHidden: false,
      },
      {
        input: "2\n3 3\n6",
        output: "0 1",
        isHidden: true,
      },
      {
        input: "5\n1 5 3 7 9\n12",
        output: "1 3",
        isHidden: true,
      },
    ],
  },

  {
    title: "Valid Parentheses",
    description:
      "Given a string containing only the characters '(', ')', '{', '}', '[' and ']', determine whether the input string is valid. An input string is valid if every opening bracket is closed by the same type of bracket and brackets are closed in the correct order.",
    difficulty: "Easy",
    inputFormat:
      "The first line contains a string consisting only of bracket characters.",
    outputFormat:
      "Print true if the string is valid; otherwise print false.",
    constraints:
      "1 <= length of string <= 10^4\nThe string contains only parentheses, braces, and square brackets.",
    sampleInput: "()[]{}",
    sampleOutput: "true",
    testCases: [
      {
        input: "()[]{}",
        output: "true",
        isHidden: false,
      },
      {
        input: "(]",
        output: "false",
        isHidden: false,
      },
      {
        input: "([{}])",
        output: "true",
        isHidden: true,
      },
      {
        input: "((()))",
        output: "true",
        isHidden: true,
      },
      {
        input: "([)]",
        output: "false",
        isHidden: true,
      },
    ],
  },

  {
    title: "Binary Search",
    description:
      "Given a sorted array of integers and a target value, return the index of the target if it exists in the array. If the target does not exist, return -1.",
    difficulty: "Easy",
    inputFormat:
      "The first line contains an integer n. The second line contains n sorted integers. The third line contains the target integer.",
    outputFormat:
      "Print the zero-based index of the target, or -1 if it is not present.",
    constraints:
      "1 <= n <= 10^5\n-10^9 <= nums[i], target <= 10^9\nThe array is sorted in ascending order.",
    sampleInput: "6\n-1 0 3 5 9 12\n9",
    sampleOutput: "4",
    testCases: [
      {
        input: "6\n-1 0 3 5 9 12\n9",
        output: "4",
        isHidden: false,
      },
      {
        input: "6\n-1 0 3 5 9 12\n2",
        output: "-1",
        isHidden: false,
      },
      {
        input: "1\n5\n5",
        output: "0",
        isHidden: true,
      },
      {
        input: "5\n1 2 3 4 5\n1",
        output: "0",
        isHidden: true,
      },
    ],
  },

  {
    title: "Best Time to Buy and Sell Stock",
    description:
      "You are given an array where prices[i] is the price of a stock on the ith day. Choose one day to buy and a later day to sell to maximize your profit. Return the maximum possible profit.",
    difficulty: "Easy",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated stock prices.",
    outputFormat:
      "Print the maximum possible profit.",
    constraints:
      "1 <= n <= 10^5\n0 <= prices[i] <= 10^5",
    sampleInput: "6\n7 1 5 3 6 4",
    sampleOutput: "5",
    testCases: [
      {
        input: "6\n7 1 5 3 6 4",
        output: "5",
        isHidden: false,
      },
      {
        input: "5\n7 6 4 3 1",
        output: "0",
        isHidden: false,
      },
      {
        input: "5\n1 2 3 4 5",
        output: "4",
        isHidden: true,
      },
      {
        input: "4\n2 4 1 7",
        output: "6",
        isHidden: true,
      },
    ],
  },

  {
    title: "Longest Substring Without Repeating Characters",
    description:
      "Given a string, find the length of the longest substring without repeating characters.",
    difficulty: "Medium",
    inputFormat:
      "The first line contains a string containing printable characters.",
    outputFormat:
      "Print the length of the longest substring without repeating characters.",
    constraints:
      "0 <= length of string <= 10^5",
    sampleInput: "abcabcbb",
    sampleOutput: "3",
    testCases: [
      {
        input: "abcabcbb",
        output: "3",
        isHidden: false,
      },
      {
        input: "bbbbb",
        output: "1",
        isHidden: false,
      },
      {
        input: "pwwkew",
        output: "3",
        isHidden: true,
      },
      {
        input: "abcdef",
        output: "6",
        isHidden: true,
      },
      {
        input: "abba",
        output: "2",
        isHidden: true,
      },
    ],
  },

  {
    title: "3Sum",
    description:
      "Given an integer array, find all unique triplets [a, b, c] such that a + b + c equals zero.",
    difficulty: "Medium",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated integers.",
    outputFormat:
      "Print the number of unique triplets whose sum is zero.",
    constraints:
      "3 <= n <= 3000\n-10^5 <= nums[i] <= 10^5",
    sampleInput: "6\n-1 0 1 2 -1 -4",
    sampleOutput: "2",
    testCases: [
      {
        input: "6\n-1 0 1 2 -1 -4",
        output: "2",
        isHidden: false,
      },
      {
        input: "3\n0 0 0",
        output: "1",
        isHidden: false,
      },
      {
        input: "4\n1 2 -2 -1",
        output: "1",
        isHidden: true,
      },
      {
        input: "5\n-2 0 1 1 2",
        output: "2",
        isHidden: true,
      },
    ],
  },

  {
    title: "Container With Most Water",
    description:
      "Given an array of non-negative integers representing vertical lines, find two lines that together with the x-axis form a container that holds the most water.",
    difficulty: "Medium",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated heights.",
    outputFormat:
      "Print the maximum amount of water the container can store.",
    constraints:
      "2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    sampleInput: "9\n1 8 6 2 5 4 8 3 7",
    sampleOutput: "49",
    testCases: [
      {
        input: "9\n1 8 6 2 5 4 8 3 7",
        output: "49",
        isHidden: false,
      },
      {
        input: "2\n1 1",
        output: "1",
        isHidden: false,
      },
      {
        input: "4\n4 3 2 1",
        output: "4",
        isHidden: true,
      },
      {
        input: "5\n1 2 4 3 5",
        output: "8",
        isHidden: true,
      },
    ],
  },

  {
    title: "Merge Intervals",
    description:
      "Given a collection of intervals, merge all overlapping intervals.",
    difficulty: "Medium",
    inputFormat:
      "The first line contains an integer n. Each of the next n lines contains two integers representing the start and end of an interval.",
    outputFormat:
      "Print the number of merged intervals.",
    constraints:
      "1 <= n <= 10^4\n0 <= start <= end <= 10^6",
    sampleInput: "4\n1 3\n2 6\n8 10\n15 18",
    sampleOutput: "3",
    testCases: [
      {
        input: "4\n1 3\n2 6\n8 10\n15 18",
        output: "3",
        isHidden: false,
      },
      {
        input: "2\n1 4\n4 5",
        output: "1",
        isHidden: false,
      },
      {
        input: "5\n1 2\n3 4\n5 6\n7 8\n9 10",
        output: "5",
        isHidden: true,
      },
      {
        input: "4\n1 10\n2 3\n4 5\n6 7",
        output: "1",
        isHidden: true,
      },
    ],
  },

  {
    title: "Trapping Rain Water",
    description:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water can be trapped after raining.",
    difficulty: "Hard",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated heights.",
    outputFormat:
      "Print the total amount of trapped water.",
    constraints:
      "1 <= n <= 2 * 10^5\n0 <= height[i] <= 10^5",
    sampleInput: "12\n0 1 0 2 1 0 1 3 2 1 2 1",
    sampleOutput: "6",
    testCases: [
      {
        input: "12\n0 1 0 2 1 0 1 3 2 1 2 1",
        output: "6",
        isHidden: false,
      },
      {
        input: "6\n4 2 0 3 2 5",
        output: "9",
        isHidden: false,
      },
      {
        input: "3\n1 2 1",
        output: "0",
        isHidden: true,
      },
      {
        input: "5\n5 0 0 0 5",
        output: "15",
        isHidden: true,
      },
    ],
  },

  {
    title: "Maximum Subarray",
    description:
      "Given an integer array, find the contiguous subarray with the largest sum and return that sum.",
    difficulty: "Easy",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated integers.",
    outputFormat:
      "Print the maximum subarray sum.",
    constraints:
      "1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4",
    sampleInput: "9\n-2 1 -3 4 -1 2 1 -5 4",
    sampleOutput: "6",
    testCases: [
      {
        input: "9\n-2 1 -3 4 -1 2 1 -5 4",
        output: "6",
        isHidden: false,
      },
      {
        input: "5\n1 2 3 4 5",
        output: "15",
        isHidden: false,
      },
      {
        input: "4\n-5 -2 -8 -1",
        output: "-1",
        isHidden: true,
      },
      {
        input: "6\n5 -2 3 -1 2 -6",
        output: "7",
        isHidden: true,
      },
    ],
  },
];

async function seedProblems() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    console.log("============================================================");
    console.log("        FRIDAY / CODING BATTLE PROBLEM SEED");
    console.log("============================================================");
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log(`Connected to: ${mongoose.connection.host}`);
    console.log(`Database: ${mongoose.connection.name}`);

    const existingCount = await Problem.countDocuments();

    console.log(`Existing problems: ${existingCount}`);

    await Problem.deleteMany({});

    console.log("Existing problem documents cleared.");

    const insertedProblems = await Problem.insertMany(problems);

    console.log(`Inserted problems: ${insertedProblems.length}`);

    console.log("\nInserted problems:");

    insertedProblems.forEach((problem, index) => {
      console.log(
        `${index + 1}. ${problem.title} | ${problem.difficulty} | ${problem._id}`
      );
    });

    console.log("\nProblem database seeding completed successfully.");
  } catch (error) {
    console.error("\nProblem seeding failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed.");
  }
}

seedProblems();