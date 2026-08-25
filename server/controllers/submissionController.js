const Problem = require("../models/Problem");
const Battle = require("../models/Battle");
const Submission = require("../models/Submission");
const { executeCode } = require("../services/codeExecutionService");

const runCode = async (req, res, next) => {
  try {
    const { code, language, problemId } = req.body;
    if (!code || !language || !problemId) {
      return res.status(400).json({ message: "code, language and problemId are required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const sampleCases = [{ input: problem.sampleInput, output: problem.sampleOutput }];
    const result = await executeCode({ code, language, testCases: sampleCases });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const submitCode = async (req, res, next) => {
  try {
    const { code, language, problemId, battleId } = req.body;
    if (!code || !language || !problemId || !battleId) {
      return res
        .status(400)
        .json({ message: "code, language, problemId and battleId are required" });
    }

    const [problem, battle] = await Promise.all([
      Problem.findById(problemId),
      Battle.findById(battleId),
    ]);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    if (!battle) return res.status(404).json({ message: "Battle not found" });

    const result = await executeCode({ code, language, testCases: problem.testCases });

    const submission = await Submission.create({
      user: req.userId,
      battle: battleId,
      code,
      language,
      status: result.status,
      testCasesPassed: result.testCasesPassed,
      totalTestCases: result.totalTestCases,
      executionTime: result.executionTime,
    });

    res.status(201).json({ submission, results: result.results, simulated: result.simulated });
  } catch (err) {
    next(err);
  }
};

const getBattleSubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ battle: req.params.battleId })
      .populate("user", "name")
      .select("-code")
      .sort({ submittedAt: 1 });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

module.exports = { runCode, submitCode, getBattleSubmissions };
