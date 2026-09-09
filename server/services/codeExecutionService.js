const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const config = require("../config/codeExecution");

/* =========================================================
   LANGUAGE HELPERS
========================================================= */

function normalizeLanguage(language) {
  const value = String(language || "")
    .trim()
    .toLowerCase();

  const aliases = {
    js: "javascript",
    jsx: "javascript",
    javascript: "javascript",

    py: "python",
    python: "python",

    java: "java",

    c: "cpp",
    cc: "cpp",
    cxx: "cpp",
    cpp: "cpp",
    "c++": "cpp",
  };

  return aliases[value] || value;
}

/* =========================================================
   OUTPUT HELPERS
========================================================= */

function normalizeOutput(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function outputsMatch(actual, expected) {
  return (
    normalizeOutput(actual) ===
    normalizeOutput(expected)
  );
}

/* =========================================================
   TEMP DIRECTORY
========================================================= */

async function createTempDirectory() {
  const folderName =
    `coding-battle-${crypto.randomBytes(8).toString("hex")}`;

  return fs.mkdtemp(
    path.join(os.tmpdir(), `${folderName}-`)
  );
}

async function cleanupDirectory(dir) {
  if (!dir) return;

  try {
    await fs.rm(dir, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    console.error(
      "Temporary directory cleanup failed:",
      error.message
    );
  }
}

/* =========================================================
   TIMEOUT
========================================================= */

function getTimeoutMs() {
  const timeout = Number(config.timeoutMs);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return 5000;
  }

  return timeout;
}

/* =========================================================
   PROCESS EXECUTION
========================================================= */

/*
  IMPORTANT:

  We use spawn() instead of execFile() because the submitted
  program must receive the test-case input through stdin.

  Example:

  Test case input:
      ()[]{}

  The runner sends that exact text to:

      process.stdin

  The student's program reads it from stdin.

  This is required for real competitive-programming style
  execution.
*/

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const timeout =
      options.timeout || getTimeoutMs();

    const startedAt = Date.now();

    let stdout = "";
    let stderr = "";

    let finished = false;
    let timedOut = false;

    let child;

    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        windowsHide: true,
        shell: false,
      });
    } catch (error) {
      resolve({
        success: false,
        stdout: "",
        stderr: error.message || "",
        error,
        executionTime: Date.now() - startedAt,
        timedOut: false,
      });

      return;
    }

    const finish = (result) => {
      if (finished) return;

      finished = true;

      clearTimeout(timeoutTimer);

      resolve({
        ...result,
        executionTime:
          Date.now() - startedAt,
      });
    };

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      finish({
        success: false,
        stdout,
        stderr,
        error,
        timedOut,
      });
    });

    child.on("close", (exitCode, signal) => {
      if (timedOut) {
        finish({
          success: false,
          stdout,
          stderr,
          error: new Error(
            "Process timed out."
          ),
          exitCode,
          signal,
          timedOut: true,
        });

        return;
      }

      if (exitCode === 0) {
        finish({
          success: true,
          stdout,
          stderr,
          exitCode,
          signal,
          timedOut: false,
        });

        return;
      }

      finish({
        success: false,
        stdout,
        stderr,
        error: new Error(
          stderr ||
            `Process exited with code ${exitCode}.`
        ),
        exitCode,
        signal,
        timedOut: false,
      });
    });

    /*
      Send test-case input through stdin.
    */
    if (child.stdin) {
      const input =
        options.input === undefined ||
        options.input === null
          ? ""
          : String(options.input);

      child.stdin.write(input);

      /*
        Close stdin so programs waiting for EOF
        can continue processing.
      */
      child.stdin.end();
    }

    /*
      Enforce time limit.
    */
    const timeoutTimer = setTimeout(() => {
      if (finished) return;

      timedOut = true;

      try {
        child.kill();
      } catch (error) {
        // Process may already have exited.
      }
    }, timeout);
  });
}

/* =========================================================
   JAVASCRIPT
========================================================= */

async function executeJavaScript(
  code,
  input,
  dir
) {
  const filePath = path.join(
    dir,
    "solution.js"
  );

  await fs.writeFile(
    filePath,
    code,
    "utf8"
  );

  return runProcess(
    process.execPath,
    [filePath],
    {
      cwd: dir,
      input,
    }
  );
}

/* =========================================================
   PYTHON
========================================================= */

async function executePython(
  code,
  input,
  dir
) {
  const filePath = path.join(
    dir,
    "solution.py"
  );

  await fs.writeFile(
    filePath,
    code,
    "utf8"
  );

  return runProcess(
    "python",
    [filePath],
    {
      cwd: dir,
      input,
    }
  );
}

/* =========================================================
   JAVA
========================================================= */

async function executeJava(
  code,
  input,
  dir
) {
  const filePath = path.join(
    dir,
    "Main.java"
  );

  await fs.writeFile(
    filePath,
    code,
    "utf8"
  );

  /*
    Compile first.
  */
  const compileResult = await runProcess(
    "javac",
    [filePath],
    {
      cwd: dir,
    }
  );

  if (!compileResult.success) {
    return {
      ...compileResult,
      compileError: true,
    };
  }

  /*
    Then run the compiled Java program.
  */
  return runProcess(
    "java",
    [
      "-cp",
      dir,
      "Main",
    ],
    {
      cwd: dir,
      input,
    }
  );
}

/* =========================================================
   C++
========================================================= */

async function executeCpp(
  code,
  input,
  dir
) {
  const sourcePath =
    path.join(
      dir,
      "main.cpp"
    );

  const executablePath =
    process.platform === "win32"
      ? path.join(
          dir,
          "main.exe"
        )
      : path.join(
          dir,
          "main"
        );

  await fs.writeFile(
    sourcePath,
    code,
    "utf8"
  );

  /*
    Compile C++17 program.
  */
  const compileResult = await runProcess(
    "g++",
    [
      sourcePath,
      "-std=c++17",
      "-O2",
      "-o",
      executablePath,
    ],
    {
      cwd: dir,
    }
  );

  if (!compileResult.success) {
    return {
      ...compileResult,
      compileError: true,
    };
  }

  /*
    Run executable with test input.
  */
  return runProcess(
    executablePath,
    [],
    {
      cwd: dir,
      input,
    }
  );
}

/* =========================================================
   SINGLE TEST CASE
========================================================= */

async function executeSingleTest({
  code,
  language,
  testCase,
  dir,
}) {
  const input =
    testCase?.input ?? "";

  const expectedOutput =
    testCase?.output ?? "";

  let execution;

  switch (language) {
    case "javascript":
      execution =
        await executeJavaScript(
          code,
          input,
          dir
        );
      break;

    case "python":
      execution =
        await executePython(
          code,
          input,
          dir
        );
      break;

    case "java":
      execution =
        await executeJava(
          code,
          input,
          dir
        );
      break;

    case "cpp":
      execution =
        await executeCpp(
          code,
          input,
          dir
        );
      break;

    default:
      return {
        passed: false,
        input,
        expectedOutput,
        actualOutput: "",
        error:
          `Unsupported language: ${language}`,
        status: "runtime_error",
        executionTime: 0,
      };
  }

  const actualOutput =
    execution.stdout || "";

  /* =======================================================
     COMPILE ERROR
  ======================================================= */

  if (execution.compileError) {
    return {
      passed: false,
      input,
      expectedOutput,
      actualOutput,
      error:
        execution.stderr ||
        "Compilation failed.",
      status: "compile_error",
      executionTime:
        execution.executionTime,
    };
  }

  /* =======================================================
     TIME LIMIT
  ======================================================= */

  if (
    execution.timedOut ||
    execution.error?.killed
  ) {
    return {
      passed: false,
      input,
      expectedOutput,
      actualOutput,
      error:
        "Time limit exceeded.",
      status:
        "time_limit_exceeded",
      executionTime:
        execution.executionTime,
    };
  }

  /* =======================================================
     RUNTIME ERROR
  ======================================================= */

  if (!execution.success) {
    return {
      passed: false,
      input,
      expectedOutput,
      actualOutput,
      error:
        execution.stderr ||
        execution.error?.message ||
        "Runtime error.",
      status: "runtime_error",
      executionTime:
        execution.executionTime,
    };
  }

  /* =======================================================
     OUTPUT COMPARISON
  ======================================================= */

  const passed =
    outputsMatch(
      actualOutput,
      expectedOutput
    );

  return {
    passed,
    input,
    expectedOutput,
    actualOutput,
    error:
      passed
        ? null
        : "Wrong answer.",
    status:
      passed
        ? "accepted"
        : "wrong_answer",
    executionTime:
      execution.executionTime,
  };
}

/* =========================================================
   LOCAL EXECUTION
========================================================= */

async function executeLocally({
  code,
  language,
  testCases,
}) {
  const normalizedLanguage =
    normalizeLanguage(language);

  const cases =
    Array.isArray(testCases)
      ? testCases
      : [];

  /*
    No test cases means the problem itself
    is not configured correctly.

    Never silently accept code.
  */
  if (cases.length === 0) {
    return {
      status: "runtime_error",
      testCasesPassed: 0,
      totalTestCases: 0,
      executionTime: 0,
      results: [],
      simulated: false,
      message:
        "This problem has no test cases configured.",
    };
  }

  const dir =
    await createTempDirectory();

  const results = [];

  let totalExecutionTime = 0;

  try {
    /*
      Execute every test case.

      We stop at the first failure.
    */
    for (const testCase of cases) {
      const result =
        await executeSingleTest({
          code,
          language:
            normalizedLanguage,
          testCase,
          dir,
        });

      results.push(result);

      totalExecutionTime +=
        Number(
          result.executionTime
        ) || 0;

      if (!result.passed) {
        break;
      }
    }

    const passedCount =
      results.filter(
        (result) =>
          result.passed
      ).length;

    const failedResult =
      results.find(
        (result) =>
          !result.passed
      );

    let status = "accepted";

    if (failedResult) {
      status =
        failedResult.status;
    }

    return {
      status,

      testCasesPassed:
        passedCount,

      totalTestCases:
        cases.length,

      executionTime:
        totalExecutionTime,

      results,

      simulated: false,
    };
  } finally {
    await cleanupDirectory(dir);
  }
}

/* =========================================================
   MAIN EXECUTOR
========================================================= */

async function executeCode({
  code,
  language,
  testCases,
}) {
  /*
    Empty code should never be accepted.
  */
  if (
    !code ||
    !String(code).trim()
  ) {
    return {
      status: "compile_error",

      testCasesPassed: 0,

      totalTestCases:
        Array.isArray(testCases)
          ? testCases.length
          : 0,

      executionTime: 0,

      results: [],

      simulated: false,

      message:
        "Code cannot be empty.",
    };
  }

  const normalizedLanguage =
    normalizeLanguage(language);

  /*
    Local execution is the active provider.
  */
  if (
    config.provider === "local"
  ) {
    return executeLocally({
      code,
      language:
        normalizedLanguage,
      testCases,
    });
  }

  /*
    Never fake acceptance if a provider
    is unavailable.
  */
  return {
    status: "runtime_error",

    testCasesPassed: 0,

    totalTestCases:
      Array.isArray(testCases)
        ? testCases.length
        : 0,

    executionTime: 0,

    results: [],

    simulated: false,

    message:
      `Code execution provider "${config.provider}" is not available.`,
  };
}

module.exports = {
  executeCode,
};
