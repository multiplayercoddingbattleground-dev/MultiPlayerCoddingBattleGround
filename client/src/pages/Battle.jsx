import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Send,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const SOCKET_URL = "http://localhost:5000";

const QUESTION_TIME = 15 * 60;
const TOTAL_QUESTIONS = 5;
const TOTAL_TIME = QUESTION_TIME * TOTAL_QUESTIONS;

const LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript",
    monaco: "javascript",
  },
  {
    value: "python",
    label: "Python",
    monaco: "python",
  },
  {
    value: "java",
    label: "Java",
    monaco: "java",
  },
  {
    value: "c",
    label: "C",
    monaco: "c",
  },
];

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function getCurrentUserId() {
  const direct =
    localStorage.getItem("userId") ||
    localStorage.getItem("currentUserId");

  if (direct) {
    return direct;
  }

  const possibleKeys = [
    "user",
    "currentUser",
    "userData",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (!value) continue;

    try {
      const parsed = JSON.parse(value);

      if (parsed?._id) return String(parsed._id);
      if (parsed?.id) return String(parsed.id);
      if (parsed?.user?._id) return String(parsed.user._id);
      if (parsed?.user?.id) return String(parsed.user.id);
    } catch {
      // Ignore invalid localStorage JSON.
    }
  }

  return "";
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);

  const minutes = Math.floor(value / 60);
  const remaining = value % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

function getPlayerId(player) {
  if (!player) return "";

  if (typeof player === "string") {
    return player;
  }

  return String(
    player._id ||
      player.id ||
      player.userId ||
      player.user?._id ||
      player.user?.id ||
      ""
  );
}

function getPlayerName(player, index) {
  if (!player) {
    return `Player ${index + 1}`;
  }

  if (typeof player === "string") {
    return `Player ${index + 1}`;
  }

  return (
    player.name ||
    player.username ||
    player.fullName ||
    player.user?.name ||
    player.user?.username ||
    `Player ${index + 1}`
  );
}

function normalizeBattle(response) {
  if (!response) return null;

  if (response.battle) {
    return response.battle;
  }

  if (response.data?.battle) {
    return response.data.battle;
  }

  if (response.data?._id) {
    return response.data;
  }

  return response;
}

function getProblems(battle) {
  if (!battle) return [];

  if (Array.isArray(battle.problems)) {
    return battle.problems;
  }

  if (Array.isArray(battle.selectedProblems)) {
    return battle.selectedProblems;
  }

  return [];
}

function getProblemTitle(problem, index) {
  return (
    problem?.title ||
    problem?.name ||
    problem?.problemTitle ||
    `Problem ${index + 1}`
  );
}

function getProblemDescription(problem) {
  return (
    problem?.description ||
    problem?.statement ||
    problem?.question ||
    "No problem description available."
  );
}

function getStarterCode(problem, language) {
  if (!problem) return "";

  const starter =
    problem.starterCode ||
    problem.starterCodes ||
    problem.initialCode ||
    problem.codeTemplate ||
    "";

  if (typeof starter === "string") {
    return starter;
  }

  if (starter && typeof starter === "object") {
    return (
      starter[language] ||
      starter[language.toLowerCase()] ||
      ""
    );
  }

  return "";
}

function Battle() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  /*
   * IMPORTANT FIX
   * -------------------------
   * The token is declared here.
   */
  const token = getToken();

  const currentUserId = getCurrentUserId();

  const cleanRoomCode = String(roomCode || "")
    .trim()
    .toUpperCase();

  const socketRef = useRef(null);

  const battleStartedAtRef = useRef(null);
  const questionStartedAtRef = useRef(null);

  const editorProblemRef = useRef("");
  const editorLanguageRef = useRef("");

  const [battle, setBattle] = useState(null);
  const [problems, setProblems] = useState([]);
  const [players, setPlayers] = useState([]);

  const [selectedProblem, setSelectedProblem] = useState(0);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [questionRemaining, setQuestionRemaining] =
    useState(QUESTION_TIME);

  const [battleRemaining, setBattleRemaining] =
    useState(TOTAL_TIME);

  const [questionNumber, setQuestionNumber] =
    useState(1);

  const [battleStatus, setBattleStatus] =
    useState("waiting");

  const [battleEnded, setBattleEnded] = useState(false);

  const currentProblem =
    problems[selectedProblem] || null;

  /*
   * ---------------------------------------------------------
   * LOAD BATTLE
   * ---------------------------------------------------------
   */

  const loadBattle = useCallback(
    async (silent = false) => {
      if (!cleanRoomCode) {
        setError("Battle room code is missing.");
        setLoading(false);
        return;
      }

      if (!token) {
        setError(
          "Authentication token not found. Please login again."
        );
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        /*
         * IMPORTANT:
         * Use ROOM CODE, not undefined battleId.
         */
        const response = await fetch(
          `${API_URL}/battles/${encodeURIComponent(
            cleanRoomCode
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `Failed to load battle (${response.status})`
          );
        }

        const battleData = normalizeBattle(data);
        const loadedProblems = getProblems(battleData);

        setBattle(battleData);
        setProblems(loadedProblems);

        if (Array.isArray(battleData?.players)) {
          setPlayers(battleData.players);
        }

        const status =
          battleData?.status ||
          battleData?.battleStatus ||
          "waiting";

        setBattleStatus(String(status).toLowerCase());

        /*
         * Battle start time.
         */
        const battleStart =
          battleData?.startedAt ||
          battleData?.startTime;

        if (battleStart) {
          const timestamp = new Date(
            battleStart
          ).getTime();

          if (!Number.isNaN(timestamp)) {
            battleStartedAtRef.current = timestamp;
          }
        }

        /*
         * Question start time.
         */
        const questionStart =
          battleData?.questionStartedAt ||
          battleData?.currentQuestionStartedAt;

        if (questionStart) {
          const timestamp = new Date(
            questionStart
          ).getTime();

          if (!Number.isNaN(timestamp)) {
            questionStartedAtRef.current =
              timestamp;
          }
        }

        /*
         * Current question.
         */
        const serverQuestion =
          battleData?.currentQuestion ??
          battleData?.questionIndex ??
          0;

        if (
          Number.isInteger(
            Number(serverQuestion)
          )
        ) {
          const index = Number(serverQuestion);

          if (
            index >= 0 &&
            index < loadedProblems.length
          ) {
            setSelectedProblem(index);
            setQuestionNumber(index + 1);
          }
        }

        /*
         * Server timer values.
         */
        if (
          battleData?.remainingSeconds !==
          undefined
        ) {
          setBattleRemaining(
            Math.max(
              0,
              Number(battleData.remainingSeconds)
            )
          );
        }

        if (
          battleData?.questionRemainingSeconds !==
          undefined
        ) {
          setQuestionRemaining(
            Math.max(
              0,
              Number(
                battleData.questionRemainingSeconds
              )
            )
          );
        }

        setError("");

        console.log(
          "Battle loaded successfully:",
          battleData
        );

        console.log(
          "Problems:",
          loadedProblems
        );
      } catch (err) {
        console.error(
          "Battle loading error:",
          err
        );

        setError(
          err?.message ||
            "Failed to load battle."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cleanRoomCode, token]
  );

  useEffect(() => {
    loadBattle();
  }, [loadBattle]);

  /*
   * ---------------------------------------------------------
   * SOCKET.IO
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;
    let socket = null;

    async function connectSocket() {
      try {
        const socketModule = await import(
          "socket.io-client"
        );

        const io = socketModule.io;

        socket = io(SOCKET_URL, {
          transports: ["polling", "websocket"],
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (!mounted) return;

          console.log(
            "Battle Socket connected:",
            socket.id
          );

          setSocketConnected(true);

          socket.emit("join-room", {
            roomCode: cleanRoomCode,
            userId: currentUserId,
            username:
              localStorage.getItem("username") ||
              localStorage.getItem(
                "battleUsername"
              ) ||
              "Coder",
          });
        });

        socket.on("disconnect", (reason) => {
          if (!mounted) return;

          console.warn(
            "Battle Socket disconnected:",
            reason
          );

          setSocketConnected(false);
        });

        socket.on(
          "connect_error",
          (err) => {
            console.warn(
              "Socket connection error:",
              err?.message
            );

            setSocketConnected(false);
          }
        );

        socket.on("room-update", (data) => {
          if (!mounted || !data) return;

          console.log(
            "Battle room update:",
            data
          );

          setBattle((previous) => ({
            ...(previous || {}),
            ...data,
          }));

          if (Array.isArray(data.players)) {
            setPlayers(data.players);
          }

          if (data.status) {
            setBattleStatus(
              String(data.status).toLowerCase()
            );
          }

          if (data.startedAt) {
            const timestamp =
              Number(data.startedAt);

            if (!Number.isNaN(timestamp)) {
              battleStartedAtRef.current =
                timestamp;
            }
          }

          if (
            data.remainingSeconds !==
            undefined
          ) {
            setBattleRemaining(
              Math.max(
                0,
                Number(data.remainingSeconds)
              )
            );
          }
        });

        socket.on("room-state", (data) => {
          if (!mounted || !data) return;

          console.log(
            "Battle room state:",
            data
          );

          setBattle((previous) => ({
            ...(previous || {}),
            ...data,
          }));

          if (Array.isArray(data.players)) {
            setPlayers(data.players);
          }

          if (data.status) {
            setBattleStatus(
              String(data.status).toLowerCase()
            );
          }
        });

        socket.on(
          "players-update",
          (data) => {
            if (!mounted) return;

            if (Array.isArray(data)) {
              setPlayers(data);
            } else if (
              Array.isArray(data?.players)
            ) {
              setPlayers(data.players);
            }
          }
        );

        socket.on(
          "battle-started",
          (data) => {
            if (!mounted) return;

            console.log(
              "Battle started:",
              data
            );

            setBattleStatus("active");

            const startedAt =
              data?.startedAt ||
              Date.now();

            battleStartedAtRef.current =
              Number(startedAt);

            questionStartedAtRef.current =
              Number(
                data?.questionStartedAt ||
                  startedAt
              );

            setQuestionNumber(
              Number(
                data?.questionNumber || 1
              )
            );

            setSelectedProblem(0);

            setBattleRemaining(
              TOTAL_TIME
            );

            setQuestionRemaining(
              QUESTION_TIME
            );

            setResult(null);
            setResultType("");

            loadBattle(true);
          }
        );

        socket.on(
          "question-timer",
          (data) => {
            if (!mounted || !data) return;

            if (
              data.remainingSeconds !==
              undefined
            ) {
              setQuestionRemaining(
                Math.max(
                  0,
                  Number(
                    data.remainingSeconds
                  )
                )
              );
            }

            if (
              data.battleRemainingSeconds !==
              undefined
            ) {
              setBattleRemaining(
                Math.max(
                  0,
                  Number(
                    data.battleRemainingSeconds
                  )
                )
              );
            }

            if (
              data.questionNumber
            ) {
              setQuestionNumber(
                Number(
                  data.questionNumber
                )
              );
            }

            if (
              data.questionStartedAt
            ) {
              questionStartedAtRef.current =
                Number(
                  data.questionStartedAt
                );
            }

            if (data.status) {
              setBattleStatus(
                String(
                  data.status
                ).toLowerCase()
              );
            }
          }
        );

        socket.on(
          "question-changed",
          (data) => {
            if (!mounted) return;

            console.log(
              "Question changed:",
              data
            );

            const index = Number(
              data?.questionIndex
            );

            if (
              Number.isInteger(index) &&
              index >= 0 &&
              index < problems.length
            ) {
              setSelectedProblem(index);
            }

            if (
              data?.questionNumber
            ) {
              setQuestionNumber(
                Number(
                  data.questionNumber
                )
              );
            } else if (
              Number.isInteger(index)
            ) {
              setQuestionNumber(
                index + 1
              );
            }

            if (
              data?.questionStartedAt
            ) {
              questionStartedAtRef.current =
                Number(
                  data.questionStartedAt
                );
            } else {
              questionStartedAtRef.current =
                Date.now();
            }

            setQuestionRemaining(
              QUESTION_TIME
            );

            setResult(null);
            setResultType("");

            loadBattle(true);
          }
        );

        socket.on(
          "question-time-up",
          (data) => {
            if (!mounted) return;

            console.log(
              "Question time up:",
              data
            );

            setQuestionRemaining(0);
          }
        );

        socket.on(
          "battle-timer",
          (data) => {
            if (
              !mounted ||
              !data
            ) {
              return;
            }

            if (
              data.remainingSeconds !==
              undefined
            ) {
              setBattleRemaining(
                Math.max(
                  0,
                  Number(
                    data.remainingSeconds
                  )
                )
              );
            }
          }
        );

        socket.on("battle-ended", (data) => {
          console.log("🏁 BATTLE ENDED:", data);

          setBattleEnded(true);

          setBattle((prev) => ({
            ...(prev || {}),
            ...(data || {}),
            status: "finished",
          }));

          setTimeout(() => {
            navigate(
              `/results?room=${encodeURIComponent(
                cleanRoomCode
              )}`
            );
          }, 1500);
        });

        socket.on(
          "submission-submitted",
          () => {
            if (!mounted) return;

            console.log(
              "Submission received from socket."
            );
          }
        );
      } catch (err) {
        console.error(
          "Socket initialization error:",
          err
        );
      }
    }

    connectSocket();

    return () => {
      mounted = false;

      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      socketRef.current = null;
    };
  }, [
    cleanRoomCode,
    currentUserId,
    loadBattle,
    navigate,
    problems.length,
  ]);

  /*
   * ---------------------------------------------------------
   * LOCAL TIMER FALLBACK
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const interval = setInterval(() => {
      if (battleStartedAtRef.current) {
        const elapsed =
          (Date.now() -
            battleStartedAtRef.current) /
          1000;

        setBattleRemaining((previous) => {
          /*
           * Don't move backwards from a more
           * accurate server value.
           */
          const calculated = Math.max(
            0,
            Math.ceil(
              TOTAL_TIME - elapsed
            )
          );

          if (
            previous === 0 ||
            calculated < previous
          ) {
            return calculated;
          }

          return previous;
        });
      }

      if (questionStartedAtRef.current) {
        const elapsed =
          (Date.now() -
            questionStartedAtRef.current) /
          1000;

        setQuestionRemaining((previous) => {
          const calculated = Math.max(
            0,
            Math.ceil(
              QUESTION_TIME - elapsed
            )
          );

          if (
            previous === 0 ||
            calculated < previous
          ) {
            return calculated;
          }

          return previous;
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * EDITOR INITIALIZATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!currentProblem) {
      return;
    }

    const problemId = String(
      currentProblem._id ||
        currentProblem.id ||
        selectedProblem
    );

    const problemChanged =
      editorProblemRef.current !==
      problemId;

    const languageChanged =
      editorLanguageRef.current !==
      language;

    if (
      problemChanged ||
      languageChanged
    ) {
      const starter = getStarterCode(
        currentProblem,
        language
      );

      setCode(starter);

      editorProblemRef.current =
        problemId;

      editorLanguageRef.current =
        language;

      setResult(null);
      setResultType("");
    }
  }, [
    currentProblem,
    selectedProblem,
    language,
  ]);

  /*
   * ---------------------------------------------------------
   * RUN CODE
   * ---------------------------------------------------------
   */

  async function handleRunCode() {
    const problemId =
      currentProblem?._id ||
      currentProblem?.id;

    if (!problemId) {
      setResultType("error");
      setResult({
        message:
          "Problem ID is missing.",
      });
      return;
    }

    if (!code.trim()) {
      setResultType("error");
      setResult({
        message:
          "Please write code first.",
      });
      return;
    }

    if (!token) {
      setResultType("error");
      setResult({
        message:
          "Authentication token is missing. Please login again.",
      });
      return;
    }

    setRunning(true);
    setResult(null);
    setResultType("");

    try {
      const response = await fetch(
        `${API_URL}/submissions/run`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language,
            problemId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Code execution failed."
        );
      }

      setResult(data);

      if (
        data?.success === true ||
        data?.status === "accepted" ||
        data?.status === "passed"
      ) {
        setResultType("success");
      } else if (
        data?.status === "wrong-answer" ||
        data?.status === "failed"
      ) {
        setResultType("wrong");
      } else {
        setResultType("success");
      }
    } catch (err) {
      console.error(
        "Run code error:",
        err
      );

      setResultType("error");

      setResult({
        message:
          err?.message ||
          "Unable to execute code.",
      });
    } finally {
      setRunning(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SUBMIT CODE
   * ---------------------------------------------------------
   */

  async function handleSubmitCode() {
    const problemId =
      currentProblem?._id ||
      currentProblem?.id;

    if (!battle?._id && !battle?.id) {
      setResultType("error");
      setResult({
        message:
          "Battle ID is missing.",
      });
      return;
    }

    if (!problemId) {
      setResultType("error");
      setResult({
        message:
          "Problem ID is missing.",
      });
      return;
    }

    if (!code.trim()) {
      setResultType("error");
      setResult({
        message:
          "Please write code first.",
      });
      return;
    }

    if (!token) {
      setResultType("error");
      setResult({
        message:
          "Authentication token is missing. Please login again.",
      });
      return;
    }

    if (
      String(battleStatus).toLowerCase() ===
      "finished"
    ) {
      setResultType("error");
      setResult({
        message:
          "This battle has already ended.",
      });
      return;
    }

    setSubmitting(true);
    setResult(null);
    setResultType("");

    try {
      const battleId =
        battle._id || battle.id;

      const response = await fetch(
        `${API_URL}/submissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language,
            problemId,
            battleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Code submission failed."
        );
      }

      setResult(data);

      if (
        data?.success === true ||
        data?.status === "accepted" ||
        data?.status === "passed"
      ) {
        setResultType("success");
      } else if (
        data?.status === "wrong-answer" ||
        data?.status === "failed"
      ) {
        setResultType("wrong");
      } else {
        setResultType("success");
      }
    } catch (err) {
      console.error(
        "Submit code error:",
        err
      );

      setResultType("error");

      setResult({
        message:
          err?.message ||
          "Unable to submit code.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SELECT PROBLEM
   * ---------------------------------------------------------
   */

  function selectProblem(index) {
    setSelectedProblem(index);
    setResult(null);
    setResultType("");
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centerCard}>
          <Loader2
            size={42}
            className="battle-spinner"
          />

          <h2>Loading Coding Battle...</h2>

          <p>
            Room:{" "}
            <strong>
              {cleanRoomCode}
            </strong>
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR WITHOUT BATTLE
   * ---------------------------------------------------------
   */

  if (error && !battle) {
    return (
      <div style={styles.page}>
        <div style={styles.centerCard}>
          <XCircle
            size={48}
            style={{
              color: "#ef4444",
            }}
          />

          <h2>
            Failed to load battle
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <div style={styles.buttonRow}>
            <button
              style={styles.secondaryButton}
              onClick={() =>
                navigate(
                  "/battle-lobby"
                )
              }
            >
              <ArrowLeft size={17} />
              Back to Lobby
            </button>

            <button
              style={styles.primaryButton}
              onClick={() =>
                loadBattle()
              }
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN PAGE
   * ---------------------------------------------------------
   */

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}

        <header style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() =>
              navigate(
                "/battle-lobby"
              )
            }
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div>
            <h1 style={styles.title}>
              Multiplayer Battle
            </h1>

            <p style={styles.subtitle}>
              15 minutes per question •
              75 minutes total
            </p>
          </div>

          <div style={styles.socketStatus}>
            {socketConnected ? (
              <>
                <Wifi size={17} />
                Socket Connected
              </>
            ) : (
              <>
                <WifiOff size={17} />
                Connecting...
              </>
            )}
          </div>
        </header>

        {/* TIMER CARDS */}

        <div style={styles.timerGrid}>
          <div style={styles.timerCard}>
            <Clock3 size={25} />

            <div>
              <div style={styles.timerLabel}>
                Question Time
              </div>

              <div style={styles.timerValue}>
                {formatTime(
                  questionRemaining
                )}
              </div>
            </div>
          </div>

          <div style={styles.timerCard}>
            <Clock3 size={25} />

            <div>
              <div style={styles.timerLabel}>
                Battle Time
              </div>

              <div style={styles.timerValue}>
                {formatTime(
                  battleRemaining
                )}
              </div>
            </div>
          </div>

          <div style={styles.statusCard}>
            <span
              style={{
                ...styles.statusDot,
                background:
                  String(
                    battleStatus
                  ).toLowerCase() ===
                  "active"
                    ? "#22c55e"
                    : "#f59e0b",
              }}
            />

            {String(
              battleStatus ||
                "waiting"
            ).toUpperCase()}
          </div>
        </div>

        {/* INFO BAR */}

        <div style={styles.infoBar}>
          <div style={styles.infoItem}>
            <Users size={18} />

            Players{" "}
            <strong>
              {players.length}
            </strong>
          </div>

          <div style={styles.infoItem}>
            Question{" "}
            <strong>
              {questionNumber} /{" "}
              {TOTAL_QUESTIONS}
            </strong>
          </div>

          <button
            style={styles.refreshButton}
            onClick={() =>
              loadBattle(true)
            }
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2
                size={16}
                className="battle-spinner"
              />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div style={styles.warning}>
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* MAIN CONTENT */}

        <div style={styles.mainGrid}>
          {/* LEFT SIDEBAR */}

          <aside style={styles.sidebar}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>
                Problems
              </h2>

              <span>
                {problems.length}
              </span>
            </div>

            {problems.length === 0 ? (
              <div style={styles.empty}>
                No problem selected.
              </div>
            ) : (
              <div style={styles.problemList}>
                {problems.map(
                  (problem, index) => {
                    const active =
                      selectedProblem ===
                      index;

                    return (
                      <button
                        key={
                          problem?._id ||
                          problem?.id ||
                          index
                        }
                        style={{
                          ...styles.problemButton,
                          ...(active
                            ? styles.problemButtonActive
                            : {}),
                        }}
                        onClick={() =>
                          selectProblem(
                            index
                          )
                        }
                      >
                        <span>
                          {index + 1}.{" "}
                          {getProblemTitle(
                            problem,
                            index
                          )}
                        </span>

                        {active && (
                          <CheckCircle2
                            size={17}
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {/* PLAYERS */}

            <div
              style={{
                ...styles.panelHeader,
                marginTop: "10px",
              }}
            >
              <h2 style={styles.panelTitle}>
                Players
              </h2>

              <span>
                {players.length}
              </span>
            </div>

            <div style={styles.playersList}>
              {players.map(
                (player, index) => {
                  const playerId =
                    getPlayerId(
                      player
                    );

                  const isMe =
                    playerId ===
                    String(
                      currentUserId
                    );

                  return (
                    <div
                      key={
                        playerId ||
                        index
                      }
                      style={
                        styles.playerRow
                      }
                    >
                      <div
                        style={
                          styles.avatar
                        }
                      >
                        {getPlayerName(
                          player,
                          index
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div
                        style={
                          styles.playerDetails
                        }
                      >
                        <strong>
                          {getPlayerName(
                            player,
                            index
                          )}

                          {isMe
                            ? " (You)"
                            : ""}
                        </strong>

                        <span>
                          {player?.status ||
                            "Playing"}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}

              {players.length === 0 && (
                <div style={styles.empty}>
                  No players connected.
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT CONTENT */}

          <main style={styles.editorPanel}>
            {!currentProblem ? (
              <div style={styles.noProblem}>
                <h2>
                  No problem selected.
                </h2>

                <p>
                  Waiting for the host to
                  select coding problems.
                </p>
              </div>
            ) : (
              <>
                {/* PROBLEM */}

                <div style={styles.problemArea}>
                  <div style={styles.problemHeader}>
                    <div>
                      <h2
                        style={
                          styles.problemTitle
                        }
                      >
                        {getProblemTitle(
                          currentProblem,
                          selectedProblem
                        )}
                      </h2>

                      {currentProblem.difficulty && (
                        <span
                          style={
                            styles.difficulty
                          }
                        >
                          {
                            currentProblem.difficulty
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={
                      styles.description
                    }
                  >
                    {getProblemDescription(
                      currentProblem
                    )}
                  </p>

                  {Array.isArray(
                    currentProblem.examples
                  ) &&
                    currentProblem
                      .examples
                      .length > 0 && (
                      <div>
                        <h3>
                          Examples
                        </h3>

                        {currentProblem.examples.map(
                          (
                            example,
                            index
                          ) => (
                            <pre
                              key={
                                index
                              }
                              style={
                                styles.example
                              }
                            >
                              {typeof example ===
                              "string"
                                ? example
                                : JSON.stringify(
                                    example,
                                    null,
                                    2
                                  )}
                            </pre>
                          )
                        )}
                      </div>
                    )}
                </div>

                {/* EDITOR TOOLBAR */}

                <div
                  style={
                    styles.editorToolbar
                  }
                >
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target
                          .value
                      )
                    }
                    style={
                      styles.languageSelect
                    }
                  >
                    {LANGUAGES.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>
                      )
                    )}
                  </select>

                  <div
                    style={
                      styles.actionButtons
                    }
                  >
                    <button
                      style={
                        styles.runButton
                      }
                      onClick={
                        handleRunCode
                      }
                      disabled={
                        running ||
                        submitting ||
                        battleStatus ===
                          "finished"
                      }
                    >
                      {running ? (
                        <Loader2
                          size={17}
                          className="battle-spinner"
                        />
                      ) : (
                        <Play size={17} />
                      )}

                      {running
                        ? "Running..."
                        : "Run Code"}
                    </button>

                    <button
                      style={
                        styles.submitButton
                      }
                      onClick={
                        handleSubmitCode
                      }
                      disabled={
                        running ||
                        submitting ||
                        battleStatus ===
                          "finished"
                      }
                    >
                      {submitting ? (
                        <Loader2
                          size={17}
                          className="battle-spinner"
                        />
                      ) : (
                        <Send size={17} />
                      )}

                      {submitting
                        ? "Submitting..."
                        : "Submit Code"}
                    </button>
                  </div>
                </div>

                {/* MONACO */}

                <div style={styles.editor}>
                  <Editor
                    height="430px"
                    language={
                      LANGUAGES.find(
                        (item) =>
                          item.value ===
                          language
                      )?.monaco ||
                      "javascript"
                    }
                    theme="vs-dark"
                    value={code}
                    onChange={(value) =>
                      setCode(
                        value || ""
                      )
                    }
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      fontSize: 15,
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                    }}
                  />
                </div>

                {/* RESULT */}

                {result && (
                  <div
                    style={{
                      ...styles.result,
                      ...(resultType ===
                      "success"
                        ? styles.resultSuccess
                        : resultType ===
                          "wrong"
                        ? styles.resultWrong
                        : styles.resultError),
                    }}
                  >
                    <div
                      style={
                        styles.resultHeader
                      }
                    >
                      {resultType ===
                      "success" ? (
                        <CheckCircle2
                          size={20}
                        />
                      ) : (
                        <XCircle
                          size={20}
                        />
                      )}

                      <strong>
                        {resultType ===
                        "success"
                          ? "Success"
                          : resultType ===
                            "wrong"
                          ? "Wrong Answer"
                          : "Error"}
                      </strong>
                    </div>

                    <pre
                      style={
                        styles.resultText
                      }
                    >
                      {typeof result ===
                      "string"
                        ? result
                        : result.message ||
                          result.output ||
                          result.error ||
                          JSON.stringify(
                            result,
                            null,
                            2
                          )}
                    </pre>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* FOOTER */}

        <footer style={styles.footer}>
          <span>
            Room:{" "}
            <strong>
              {cleanRoomCode}
            </strong>
          </span>

          <span>
            Socket:{" "}
            <strong>
              {socketConnected
                ? "Connected"
                : "Connecting..."}
            </strong>
          </span>

          <span>
            Q{questionNumber} /{" "}
            {TOTAL_QUESTIONS}
          </span>
        </footer>
      </div>

      <style>
        {`
          .battle-spinner {
            animation: battle-spin 1s linear infinite;
          }

          @keyframes battle-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 900px) {
            .battle-page-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#e5e7eb",
    padding: "24px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  centerCard: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "40px",
    textAlign: "center",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "14px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
  },

  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#e5e7eb",
    cursor: "pointer",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#94a3b8",
  },

  socketStatus: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 13px",
    borderRadius: "20px",
    background: "#111827",
    border: "1px solid #334155",
  },

  timerGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr 180px",
    gap: "14px",
    marginBottom: "14px",
  },

  timerCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
  },

  timerLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "4px",
  },

  timerValue: {
    fontSize: "25px",
    fontWeight: 700,
  },

  statusCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    fontWeight: 700,
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
  },

  infoBar: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
    padding: "13px 16px",
    marginBottom: "14px",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "10px",
  },

  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  refreshButton: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "7px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e5e7eb",
    cursor: "pointer",
  },

  warning: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "8px",
    background: "#3f1d1d",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns:
      "300px minmax(0, 1fr)",
    gap: "16px",
  },

  sidebar: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    overflow: "hidden",
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 16px",
    borderBottom: "1px solid #1e293b",
  },

  panelTitle: {
    margin: 0,
    fontSize: "18px",
  },

  problemList: {
    padding: "8px",
  },

  problemButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "11px",
    marginBottom: "6px",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: "#0f172a",
    color: "#e5e7eb",
    textAlign: "left",
    cursor: "pointer",
  },

  problemButtonActive: {
    background: "#172554",
    border: "1px solid #3b82f6",
  },

  playersList: {
    padding: "8px",
  },

  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 8px",
    borderBottom: "1px solid #1e293b",
  },

  avatar: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#1e3a8a",
    fontWeight: 700,
  },

  playerDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  editorPanel: {
    minWidth: 0,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    overflow: "hidden",
  },

  problemArea: {
    padding: "20px",
    maxHeight: "310px",
    overflowY: "auto",
  },

  problemHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  problemTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
  },

  difficulty: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "5px",
    background: "#1e293b",
    color: "#cbd5e1",
    fontSize: "12px",
  },

  description: {
    color: "#cbd5e1",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },

  example: {
    padding: "12px",
    background: "#0f172a",
    borderRadius: "7px",
    overflowX: "auto",
  },

  editorToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px",
    borderTop: "1px solid #1e293b",
    borderBottom: "1px solid #1e293b",
  },

  languageSelect: {
    padding: "9px 12px",
    borderRadius: "7px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e5e7eb",
  },

  actionButtons: {
    display: "flex",
    gap: "8px",
  },

  runButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  submitButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  editor: {
    minHeight: "430px",
  },

  result: {
    margin: "12px",
    padding: "14px",
    borderRadius: "8px",
  },

  resultSuccess: {
    background: "#052e16",
    border: "1px solid #166534",
  },

  resultWrong: {
    background: "#3f2b0a",
    border: "1px solid #854d0e",
  },

  resultError: {
    background: "#3f1d1d",
    border: "1px solid #7f1d1d",
  },

  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "8px",
  },

  resultText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    color: "#cbd5e1",
  },

  noProblem: {
    minHeight: "650px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
  },

  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "14px",
    padding: "12px 16px",
    borderRadius: "9px",
    background: "#111827",
    border: "1px solid #1e293b",
    color: "#94a3b8",
  },

  errorText: {
    color: "#fca5a5",
    lineHeight: 1.6,
  },

  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "20px",
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },

  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 16px",
    border: "1px solid #334155",
    borderRadius: "7px",
    background: "#0f172a",
    color: "#e5e7eb",
    cursor: "pointer",
  },
};

export default Battle;