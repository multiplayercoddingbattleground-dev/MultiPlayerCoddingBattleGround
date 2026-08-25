import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBattle, getProblemById, runCode, submitCode } from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import CodeEditor from "../components/CodeEditor";
import BattleTimer from "../components/BattleTimer";

const LANGUAGES = ["javascript", "python", "java", "cpp"];

function Battle() {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [battle, setBattle] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [players, setPlayers] = useState([]);
  const [readyIds, setReadyIds] = useState(new Set());
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consoleLines, setConsoleLines] = useState([
    { text: "Waiting for you to run or submit code...", type: "info" },
  ]);

  const codeRef = useRef(code);
  codeRef.current = code;

  const isHost = Boolean(
    battle && battle.players[0] && String(battle.players[0]._id) === String(user.id)
  );
  const selfReady = readyIds.has(user.id);

  const addConsole = (text, type = "info") =>
    setConsoleLines((prev) => [...prev, { text, type }]);

  const nameFor = (userId) =>
    players.find((p) => p.id === userId)?.name || "Opponent";

  // Load the battle + full problem details
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const battleData = await getBattle(roomCode);
        if (cancelled) return;
        setBattle(battleData);

        if (battleData.problem) {
          const problemId = battleData.problem._id || battleData.problem;
          const problemData = await getProblemById(problemId);
          if (cancelled) return;
          setProblem(problemData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Could not load this battle room");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  // Realtime room connection
  useEffect(() => {
    socket.connect();
    socket.emit("battle:join", { roomCode, userId: user.id, name: user.name });

    const onPlayerJoined = ({ players: roomPlayers }) => setPlayers(roomPlayers);
    const onPlayerReady = ({ userId }) =>
      setReadyIds((prev) => new Set(prev).add(userId));
    const onStarted = ({ startTime: ts }) => {
      setStarted(true);
      setStartTime(ts);
      addConsole("Battle started! Good luck.", "success");
    };
    const onOpponentStatus = ({ userId, status }) =>
      setPlayers((prev) => prev.map((p) => (p.id === userId ? { ...p, status } : p)));
    const onOpponentSubmitted = ({ userId, result }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: "submitted" } : p))
      );
      addConsole(`${nameFor(userId)} submitted (${result?.status || "unknown"})`, "info");
    };
    const onFinished = ({ winnerId }) => {
      navigate("/results", {
        state: {
          roomCode,
          winnerId,
          winnerName: nameFor(winnerId),
          isWinner: winnerId === user.id,
        },
      });
    };
    const onPlayerLeft = ({ userId }) =>
      setPlayers((prev) => prev.filter((p) => p.id !== userId));

    socket.on("battle:playerJoined", onPlayerJoined);
    socket.on("battle:playerReady", onPlayerReady);
    socket.on("battle:started", onStarted);
    socket.on("battle:opponentStatus", onOpponentStatus);
    socket.on("battle:opponentSubmitted", onOpponentSubmitted);
    socket.on("battle:finished", onFinished);
    socket.on("battle:playerLeft", onPlayerLeft);

    return () => {
      socket.off("battle:playerJoined", onPlayerJoined);
      socket.off("battle:playerReady", onPlayerReady);
      socket.off("battle:started", onStarted);
      socket.off("battle:opponentStatus", onOpponentStatus);
      socket.off("battle:opponentSubmitted", onOpponentSubmitted);
      socket.off("battle:finished", onFinished);
      socket.off("battle:playerLeft", onPlayerLeft);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, user.id]);

  const handleReady = () => {
    socket.emit("battle:ready", { roomCode, userId: user.id });
    setReadyIds((prev) => new Set(prev).add(user.id));
  };

  const handleStart = () => {
    socket.emit("battle:start", { roomCode, startTime: Date.now() });
  };

  const handleRun = async () => {
    if (!problem) return;
    setRunning(true);
    socket.emit("battle:statusUpdate", { roomCode, userId: user.id, status: "testing" });

    try {
      const result = await runCode({ code: codeRef.current, language, problemId: problem._id });
      result.results?.forEach((r, i) =>
        addConsole(
          `Sample ${i + 1}: ${r.passed ? "passed" : "failed"}${r.passed ? "" : ` (expected ${r.expectedOutput}, got ${r.actualOutput})`}`,
          r.passed ? "success" : "error"
        )
      );
      if (result.simulated) {
        addConsole("Note: code execution is running in simulated (stub) mode.", "info");
      }
    } catch (err) {
      addConsole(err.message || "Run failed", "error");
    } finally {
      setRunning(false);
      socket.emit("battle:statusUpdate", { roomCode, userId: user.id, status: "coding" });
    }
  };

  const handleSubmit = async () => {
    if (!problem || !battle) return;
    setSubmitting(true);

    try {
      const { submission, results } = await submitCode({
        code: codeRef.current,
        language,
        problemId: problem._id,
        battleId: battle._id,
      });

      addConsole(
        `Submitted: ${submission.status} (${submission.testCasesPassed}/${submission.totalTestCases} tests passed)`,
        submission.status === "accepted" ? "success" : "error"
      );

      socket.emit("battle:submit", {
        roomCode,
        userId: user.id,
        result: {
          status: submission.status,
          testCasesPassed: submission.testCasesPassed,
          totalTestCases: submission.totalTestCases,
        },
      });

      if (submission.status === "accepted") {
        socket.emit("battle:finish", { roomCode, winnerId: user.id });
        navigate("/results", {
          state: {
            roomCode,
            winnerId: user.id,
            winnerName: user.name,
            isWinner: true,
            submission,
            results,
            problemTitle: problem.title,
          },
        });
      }
    } catch (err) {
      addConsole(err.message || "Submit failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="battle-page">
        <p style={{ padding: 40 }}>Loading battle room...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="battle-page">
        <p style={{ padding: 40 }}>
          {loadError} — <Link to="/battle-lobby">Back to lobby</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="battle-page">
      <header className="arena-header">
        <div className="arena-title">
          <span className="online-dot" />
          <h1>⚔ {problem ? problem.title : "Coding Battle"}</h1>
        </div>

        {started ? (
          <BattleTimer key={startTime} initialTime={900} />
        ) : (
          <span className="battle-timer">Room {roomCode}</span>
        )}
      </header>

      {!started && (
        <div className="battle-controls" style={{ justifyContent: "space-between" }}>
          <span>
            {players.length} player(s) in room.{" "}
            {isHost ? "You are the host." : "Waiting for the host to start..."}
          </span>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="run-btn" onClick={handleReady} disabled={selfReady}>
              {selfReady ? "Ready ✓" : "Ready"}
            </button>

            {isHost && (
              <button className="submit-btn" onClick={handleStart}>
                Start Battle
              </button>
            )}
          </div>
        </div>
      )}

      <div className="battle-grid">
        <div className="problem-panel">
          <div className="problem-header">Challenge</div>

          <div className="problem-content">
            {problem ? (
              <>
                <h2>
                  {problem.title} · {problem.difficulty}
                </h2>
                <p>{problem.description}</p>

                {problem.constraints && (
                  <>
                    <h3>Constraints</h3>
                    <p>{problem.constraints}</p>
                  </>
                )}

                {(problem.sampleInput || problem.sampleOutput) && (
                  <div className="example-box">
                    Input: {problem.sampleInput}
                    <br />
                    Output: {problem.sampleOutput}
                  </div>
                )}
              </>
            ) : (
              <p>No problem is assigned to this battle yet.</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <div className="battle-controls" style={{ justifyContent: "space-between" }}>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <CodeEditor language={language} value={code} onChange={setCode} />

          <div className="battle-controls">
            <button className="run-btn" onClick={handleRun} disabled={running || !problem}>
              ▶ {running ? "Running..." : "Run Tests"}
            </button>

            <button className="submit-btn" onClick={handleSubmit} disabled={submitting || !problem}>
              📤 {submitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>

          <div className="execution-console">
            <div className="console-title">Execution Output</div>
            {consoleLines.map((line, i) => (
              <div key={i} className={line.type === "error" ? "console-error" : "console-success"}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="opponents-tray">
        {players
          .filter((p) => p.id !== user.id)
          .map((p) => (
            <div className="opponent-card" key={p.id}>
              <div className="opponent-name">
                <span>{p.name}</span>
                <span>{p.status}</span>
              </div>
              <div className="opponent-progress">
                <div
                  className="opponent-progress-bar"
                  style={{
                    width:
                      p.status === "submitted" ? "100%" : p.status === "testing" ? "60%" : "30%",
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Battle;
