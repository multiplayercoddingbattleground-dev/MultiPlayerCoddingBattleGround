const { spawn } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const config = require("../config/codeExecution");

// No sandboxed execution service is configured. Real user code is never run
// here — it is simulated so the rest of the pipeline (scoring, sockets,
// leaderboard) can be built and tested end-to-end. Set CODE_EXEC_PROVIDER to
// "remote" and configure Judge0 (see config/codeExecution.js) before
// accepting real submissions.
const runStub = async ({ testCases }) => {
  const results = testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.output,
    actualOutput: tc.output,
    passed: true,
  }));

  return {
    status: "accepted",
    testCasesPassed: results.length,
    totalTestCases: results.length,
    executionTime: 0,
    results,
    simulated: true,
  };
};

// --- Local executor: shells out to language runtimes already installed on
// this machine. No external service, no signup — but also NO SANDBOXING.
// Submitted code runs directly on this machine with a timeout as the only
// guard rail. Fine for solo local dev; never expose this to untrusted users
// without putting it behind real isolation (Docker/Piston/Judge0 etc).

// Only what's needed for node/g++ to run at all — deliberately excludes
// everything else in process.env (JWT_SECRET, MONGO_URI, CODE_EXEC_API_KEY,
// ...) so submitted code can't read the backend's secrets out of its
// environment.
const SAFE_ENV = {
  PATH: process.env.PATH,
  ...(process.platform === "win32"
    ? { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP }
    : {}),
};

const runProcess = (command, args, input, timeoutMs, cwd) =>
  new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { windowsHide: true, cwd, env: SAFE_ENV });
    } catch (err) {
      resolve({ stdout: "", stderr: err.message, code: -1, timedOut: false });
      return;
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: err.message, code: -1, timedOut: false });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });

    child.stdin.write(input || "");
    child.stdin.end();
  });

// Each entry prepares one submission: writes the source (and compiles it,
// for compiled languages) once, then returns a `run` function called once
// per test case against the same binary/script.
const LOCAL_RUNNERS = {
  javascript: async (code, tmpDir) => {
    const file = path.join(tmpDir, "main.js");
    await fs.writeFile(file, code, "utf8");
    return { run: (input, timeoutMs) => runProcess("node", [file], input, timeoutMs, tmpDir) };
  },
  cpp: async (code, tmpDir) => {
    const srcFile = path.join(tmpDir, "main.cpp");
    const exeFile = path.join(tmpDir, process.platform === "win32" ? "main.exe" : "main");
    await fs.writeFile(srcFile, code, "utf8");

    const compile = await runProcess("g++", [srcFile, "-O2", "-o", exeFile], "", 15000, tmpDir);
    if (compile.code !== 0) {
      return { compileError: (compile.stderr || "Compilation failed").trim() };
    }

    return { run: (input, timeoutMs) => runProcess(exeFile, [], input, timeoutMs, tmpDir) };
  },
};

const runLocal = async ({ code, language, testCases }) => {
  const prepare = LOCAL_RUNNERS[language];
  if (!prepare) {
    throw new Error(
      `"${language}" isn't available in local execution mode (only javascript and cpp are installed on this machine)`
    );
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codebattle-"));
  const start = Date.now();

  try {
    const prepared = await prepare(code, tmpDir);

    if (prepared.compileError) {
      const results = testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.output.trim(),
        actualOutput: "",
        passed: false,
        error: prepared.compileError,
      }));

      return {
        status: "compile-error",
        testCasesPassed: 0,
        totalTestCases: results.length,
        executionTime: Date.now() - start,
        results,
        simulated: false,
      };
    }

    const results = [];
    for (const testCase of testCases) {
      const expectedOutput = testCase.output.trim();
      const { stdout, stderr, code: exitCode, timedOut } = await prepared.run(testCase.input || "", config.timeoutMs);

      const actualOutput = stdout.trim();
      const runtimeError = timedOut
        ? "Execution timed out"
        : exitCode !== 0
          ? (stderr || `Process exited with code ${exitCode}`).trim()
          : null;

      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput,
        passed: !runtimeError && actualOutput === expectedOutput,
        ...(runtimeError ? { error: runtimeError } : {}),
      });
    }

    const testCasesPassed = results.filter((r) => r.passed).length;
    const status =
      testCasesPassed === results.length
        ? "accepted"
        : results.some((r) => r.error)
          ? "runtime-error"
          : "wrong-answer";

    return {
      status,
      testCasesPassed,
      totalTestCases: results.length,
      executionTime: Date.now() - start,
      results,
      simulated: false,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

// --- Judge0 CE (https://judge0.com), hosted via RapidAPI ---

const rapidApiHeaders = () => ({
  "content-type": "application/json",
  "X-RapidAPI-Key": config.apiKey,
  "X-RapidAPI-Host": new URL(config.apiUrl).host,
});

const decodeB64 = (value) => (value ? Buffer.from(value, "base64").toString("utf8") : "");

let languagesCache = null;
let languagesCacheAt = 0;
const LANGUAGES_TTL_MS = 60 * 60 * 1000;

const getLanguages = async () => {
  const now = Date.now();
  if (languagesCache && now - languagesCacheAt < LANGUAGES_TTL_MS) return languagesCache;

  const response = await fetch(`${config.apiUrl}/languages`, { headers: rapidApiHeaders() });
  if (!response.ok) {
    throw new Error(`Could not fetch execution languages (status ${response.status})`);
  }

  languagesCache = await response.json();
  languagesCacheAt = now;
  return languagesCache;
};

// Judge0's language list is a flat array of { id, name } with names like
// "Python (3.8.1)" or "JavaScript (Node.js 12.14.0)" — match by prefix so
// "Java" doesn't also match "JavaScript".
const LANGUAGE_NAME_PATTERNS = {
  javascript: /^javascript\s*\(/i,
  python: /^python\s*\(/i,
  java: /^java\s*\(/i,
  cpp: /^c\+\+\s*\(/i,
};

const resolveLanguageId = async (language) => {
  const pattern = LANGUAGE_NAME_PATTERNS[language];
  if (!pattern) return null;

  const languages = await getLanguages();
  const matches = languages.filter((l) => pattern.test(l.name));
  if (matches.length === 0) return null;

  if (language === "python") {
    const python3 = matches.find((l) => /\(3\./.test(l.name));
    if (python3) return python3.id;
  }

  return matches[0].id;
};

// Runs code against Judge0 — one synchronous submission per test case,
// comparing trimmed stdout against the expected output ourselves (Judge0's
// own pass/fail verdict isn't used since we don't send expected_output).
const runRemote = async ({ code, language, testCases }) => {
  if (!config.apiKey) {
    throw new Error(
      "CODE_EXEC_API_KEY is not set. Get a free Judge0 CE key at https://rapidapi.com/judge0-official/api/judge0-ce and add it to server/.env"
    );
  }

  const languageId = await resolveLanguageId(language);
  if (!languageId) {
    throw new Error(`"${language}" is not supported by the execution service`);
  }

  const results = [];
  const start = Date.now();
  let compileError = null;

  for (const testCase of testCases) {
    const expectedOutput = testCase.output.trim();

    if (compileError) {
      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput: "",
        passed: false,
        error: compileError,
      });
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs + 5000);

    try {
      const url = new URL(`${config.apiUrl}/submissions`);
      url.searchParams.set("base64_encoded", "true");
      url.searchParams.set("wait", "true");

      const response = await fetch(url, {
        method: "POST",
        headers: rapidApiHeaders(),
        body: JSON.stringify({
          source_code: Buffer.from(code).toString("base64"),
          language_id: languageId,
          stdin: Buffer.from(testCase.input || "").toString("base64"),
          cpu_time_limit: config.timeoutMs / 1000,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Execution service responded with ${response.status}`);
      }

      const data = await response.json();
      const statusId = data.status?.id;

      // 6 = Compilation Error
      if (statusId === 6) {
        compileError = (decodeB64(data.compile_output) || data.status?.description || "Compilation failed").trim();
        results.push({ input: testCase.input, expectedOutput, actualOutput: "", passed: false, error: compileError });
        continue;
      }

      const actualOutput = decodeB64(data.stdout).trim();
      // 3 = Accepted (i.e. ran without error — we still compare output ourselves)
      const runtimeError =
        statusId !== 3 ? (decodeB64(data.stderr) || data.status?.description || "Runtime error").trim() : null;
      const passed = statusId === 3 && actualOutput === expectedOutput;

      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput,
        passed,
        ...(runtimeError ? { error: runtimeError } : {}),
      });
    } catch (err) {
      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput: "",
        passed: false,
        error: err.name === "AbortError" ? "Execution timed out" : err.message,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const testCasesPassed = results.filter((r) => r.passed).length;
  const status = compileError
    ? "compile-error"
    : testCasesPassed === results.length
      ? "accepted"
      : results.some((r) => r.error)
        ? "runtime-error"
        : "wrong-answer";

  return {
    status,
    testCasesPassed,
    totalTestCases: results.length,
    executionTime: Date.now() - start,
    results,
    simulated: false,
  };
};

const executeCode = async ({ code, language, testCases }) => {
  if (!testCases || testCases.length === 0) {
    throw new Error("No test cases provided for execution");
  }

  if (config.provider === "remote") {
    return runRemote({ code, language, testCases });
  }

  if (config.provider === "local") {
    return runLocal({ code, language, testCases });
  }

  return runStub({ code, language, testCases });
};

module.exports = { executeCode };
