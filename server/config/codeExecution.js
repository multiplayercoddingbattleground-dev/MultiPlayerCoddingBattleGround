module.exports = {
  // "stub"   — always reports success, doesn't run anything.
  // "local"  — actually runs code on this machine (javascript/cpp only,
  //            whatever runtimes are installed) with NO sandboxing.
  // "remote" — runs code via Judge0 CE, hosted on RapidAPI (needs an API key).
  provider: process.env.CODE_EXEC_PROVIDER || "stub",
  apiUrl: process.env.CODE_EXEC_API_URL || "https://judge0-ce.p.rapidapi.com",
  apiKey: process.env.CODE_EXEC_API_KEY || "",
  timeoutMs: Number(process.env.CODE_EXEC_TIMEOUT_MS) || 5000,
};
