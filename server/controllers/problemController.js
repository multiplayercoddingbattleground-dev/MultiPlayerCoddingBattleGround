const Problem = require("../models/Problem");

const getProblems = async (req, res, next) => {
  try {
    const { difficulty } = req.query;
    const filter = difficulty ? { difficulty } : {};
    const problems = await Problem.find(filter).select(
      "title difficulty createdAt"
    );
    res.json(problems);
  } catch (err) {
    next(err);
  }
};

const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id).select(
      "-testCases.output"
    );
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    next(err);
  }
};

const createProblem = async (req, res, next) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProblems, getProblemById, createProblem };
