const provider = String(
  process.env.CODE_EXEC_PROVIDER || "local"
)
  .trim()
  .toLowerCase();

const timeoutMs = Number(
  process.env.CODE_EXEC_TIMEOUT_MS || 5000
);

module.exports = {
  provider,
  timeoutMs,
};