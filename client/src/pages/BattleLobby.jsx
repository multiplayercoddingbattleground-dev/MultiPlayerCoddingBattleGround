import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Loader2,
  Play,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const MAX_PROBLEMS = 5;
const QUESTION_MINUTES = 15;
const TOTAL_QUESTIONS = 5;
const TOTAL_MINUTES = QUESTION_MINUTES * TOTAL_QUESTIONS;

/* =========================================================
   HELPERS
========================================================= */

function sanitizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizePlayer(player) {
  if (!player) return null;

  if (typeof player === "string") {
    return {
      id: String(player),
      userId: String(player),
      username: player,
      email: "",
      online: true,
    };
  }

  const id =
    player.userId ||
    player._id ||
    player.id ||
    player.playerId ||
    player.socketId ||
    player.username ||
    player.email;

  return {
    ...player,

    id: String(id || "player"),

    userId: String(
      player.userId ||
        player._id ||
        player.id ||
        player.playerId ||
        ""
    ),

    username:
      player.username ||
      player.name ||
      player.email ||
      "Coder",

    email: player.email || "",

    online:
      player.online !== false &&
      player.isOnline !== false,
  };
}

function normalizeProblem(problem) {
  if (!problem) return null;

  if (typeof problem === "string") {
    return {
      id: String(problem),
      title: "Coding Problem",
      difficulty: "medium",
    };
  }

  const id =
    problem._id ||
    problem.id ||
    problem.problemId;

  if (!id) return null;

  return {
    ...problem,
    id: String(id),

    title:
      problem.title ||
      problem.name ||
      "Coding Problem",

    difficulty:
      problem.difficulty ||
      "medium",
  };
}

function extractBattleId(data) {
  if (!data) return "";

  const battle =
    data.battle ||
    data.room ||
    data.data ||
    data;

  const id =
    battle?._id ||
    battle?.id ||
    battle?.battleId ||
    data?.battle?._id ||
    data?.battle?.id ||
    data?.battle?.battleId ||
    data?.room?._id ||
    data?.room?.id ||
    data?.room?.battleId ||
    data?.data?._id ||
    data?.data?.id ||
    data?.data?.battleId ||
    data?._id ||
    data?.id ||
    data?.battleId ||
    "";

  return id ? String(id) : "";
}

function extractRoomCode(data, fallback = "") {
  if (!data) {
    return sanitizeRoomCode(fallback);
  }

  const battle =
    data.battle ||
    data.room ||
    data.data ||
    data;

  const code =
    battle?.roomCode ||
    battle?.code ||
    data?.battle?.roomCode ||
    data?.battle?.code ||
    data?.room?.roomCode ||
    data?.room?.code ||
    data?.data?.roomCode ||
    data?.data?.code ||
    data?.roomCode ||
    data?.code ||
    fallback;

  return sanitizeRoomCode(code);
}

function getUser() {
  return {
    userId:
      localStorage.getItem("userId") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("userID") ||
      "",

    username:
      localStorage.getItem("username") ||
      localStorage.getItem("name") ||
      localStorage.getItem("email") ||
      "Coder",

    email:
      localStorage.getItem("email") || "",

    token:
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      "",
  };
}

/* =========================================================
   COMPONENT
========================================================= */

function BattleLobby() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useMemo(
    () => getUser(),
    []
  );

  const currentUserId =
    currentUser.userId;

  const token =
    currentUser.token;

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        location.search
      ),
    [location.search]
  );

  const urlRoomCode = sanitizeRoomCode(
    searchParams.get("room")
  );

  const urlMode =
    searchParams.get("mode") || "";

  /* =======================================================
     STATE
  ======================================================= */

  const [roomCode, setRoomCode] =
    useState(urlRoomCode);

  const [joinCode, setJoinCode] =
    useState("");

  const [battleId, setBattleId] =
    useState(
      localStorage.getItem(
        "battleId"
      ) || ""
    );

  const [players, setPlayers] =
    useState([]);

  const [problems, setProblems] =
    useState([]);

  const [
    selectedProblems,
    setSelectedProblems,
  ] = useState([]);

  /*
    IMPORTANT:
    Preserve host status locally.

    This prevents a Socket.IO room-update
    from accidentally changing the host
    into a normal player when backend data
    does not contain hostId.
  */
  const [isHost, setIsHost] =
    useState(
      urlMode === "host"
    );

  const [hostId, setHostId] =
    useState("");

  const [roomCreated, setRoomCreated] =
    useState(
      Boolean(urlRoomCode)
    );

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  const cleanRoomCode =
    sanitizeRoomCode(roomCode);

  const inviteLink =
    cleanRoomCode
      ? `${window.location.origin}/battle-lobby?room=${cleanRoomCode}`
      : "";

  /* =======================================================
     APPLY BATTLE DATA
  ======================================================= */

  const applyBattleData = (
    data,
    options = {}
  ) => {
    if (!data) return;

    const battle =
      data.battle ||
      data.room ||
      data.data ||
      data;

    /* ---------------- ROOM CODE ---------------- */

    const code =
      extractRoomCode(
        data,
        options.roomCode ||
          roomCode
      );

    if (code) {
      setRoomCode(code);

      localStorage.setItem(
        "battleRoomCode",
        code
      );
    }

    /* ---------------- BATTLE ID ---------------- */

    const id =
      extractBattleId(data);

    if (id) {
      setBattleId(id);

      localStorage.setItem(
        "battleId",
        id
      );
    }

    /* ---------------- HOST ---------------- */

    const detectedHostId =
      battle?.hostId ||
      battle?.host?._id ||
      battle?.host?.id ||
      battle?.host?.userId ||
      battle?.createdBy ||
      battle?.createdBy?._id ||
      battle?.createdBy?.id ||
      "";

    if (detectedHostId) {
      const hostString =
        String(detectedHostId);

      setHostId(hostString);

      /*
        Only update host status if we
        actually know the host ID.
      */
      if (currentUserId) {
        setIsHost(
          hostString ===
            String(currentUserId)
        );
      }
    } else if (
      options.forceHost !== undefined
    ) {
      /*
        Explicit host/join mode wins
        when server doesn't return hostId.
      */
      setIsHost(
        Boolean(options.forceHost)
      );
    }

    /* ---------------- PLAYERS ---------------- */

    const rawPlayers =
      battle?.players ||
      data?.players ||
      [];

    if (
      Array.isArray(rawPlayers)
    ) {
      setPlayers(
        rawPlayers
          .map(normalizePlayer)
          .filter(Boolean)
      );
    }

    /* ---------------- SELECTED PROBLEMS ---------------- */

    const selected =
      battle?.selectedProblems ||
      battle?.problems ||
      data?.selectedProblems ||
      data?.problems ||
      [];

    if (
      Array.isArray(selected)
    ) {
      const ids = selected
        .map((problem) => {
          if (
            typeof problem ===
            "string"
          ) {
            return problem;
          }

          return (
            problem?._id ||
            problem?.id ||
            problem?.problemId ||
            null
          );
        })
        .filter(Boolean)
        .map(String)
        .slice(0, MAX_PROBLEMS);

      setSelectedProblems(ids);
    }

    setRoomCreated(true);

    /* ---------------- ACTIVE BATTLE ---------------- */

    const status =
      String(
        battle?.status ||
          data?.status ||
          ""
      ).toLowerCase();

    const active =
      status === "active" ||
      status === "started" ||
      status === "in-progress" ||
      status === "in_progress";

    if (active && code) {
      localStorage.setItem(
        "battleRoomCode",
        code
      );

      if (id) {
        localStorage.setItem(
          "battleId",
          id
        );

        navigate(
          `/battle/${code}/${id}`
        );
      } else {
        navigate(
          `/battle/${code}`
        );
      }
    }
  };

  /* =======================================================
     LOAD ROOM
  ======================================================= */

  const loadRoom = async (
    code,
    options = {}
  ) => {
    const normalizedCode =
      sanitizeRoomCode(code);

    if (!normalizedCode) return;

    try {
      setRefreshing(true);
      setError("");

      const response =
        await fetch(
          `${API_BASE}/battles/${normalizedCode}`,
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load room."
        );
      }

      applyBattleData(
        data,
        {
          roomCode:
            normalizedCode,

          /*
            If we arrived here as host,
            KEEP host.
          */
          forceHost:
            options.forceHost !==
            undefined
              ? options.forceHost
              : urlMode === "host",
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to load room."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     CREATE ROOM
  ======================================================= */

  const createRoom = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!token) {
        throw new Error(
          "Please login before creating a battle."
        );
      }

      const response =
        await fetch(
          `${API_BASE}/battles`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({}),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create battle."
        );
      }

      const createdRoomCode =
        extractRoomCode(data);

      const createdBattleId =
        extractBattleId(data);

      if (!createdRoomCode) {
        throw new Error(
          "Server did not return a room code."
        );
      }

      /* SAVE BATTLE ID */

      if (createdBattleId) {
        setBattleId(
          createdBattleId
        );

        localStorage.setItem(
          "battleId",
          createdBattleId
        );
      }

      /* SAVE ROOM */

      localStorage.setItem(
        "battleRoomCode",
        createdRoomCode
      );

      /*
        VERY IMPORTANT:
        Host is the person who created
        this room.
      */
      setIsHost(true);

      setRoomCode(
        createdRoomCode
      );

      setRoomCreated(true);

      /*
        Apply data but force host.
      */
      applyBattleData(
        data,
        {
          roomCode:
            createdRoomCode,
          forceHost: true,
        }
      );

      navigate(
        `/battle-lobby?mode=host&room=${createdRoomCode}`,
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to create battle."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     JOIN ROOM
  ======================================================= */

  const joinRoom = async () => {
    const normalizedCode =
      sanitizeRoomCode(
        joinCode
      );

    if (!normalizedCode) {
      setError(
        "Please enter the room code shared by the host."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!token) {
        throw new Error(
          "Please login before joining a battle."
        );
      }

      const response =
        await fetch(
          `${API_BASE}/battles/${normalizedCode}/join`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to join battle."
        );
      }

      const joinedBattleId =
        extractBattleId(data);

      if (joinedBattleId) {
        setBattleId(
          joinedBattleId
        );

        localStorage.setItem(
          "battleId",
          joinedBattleId
        );
      }

      localStorage.setItem(
        "battleRoomCode",
        normalizedCode
      );

      /*
        This player is NOT host.
      */
      setIsHost(false);

      setRoomCode(
        normalizedCode
      );

      setRoomCreated(true);

      applyBattleData(
        data,
        {
          roomCode:
            normalizedCode,
          forceHost: false,
        }
      );

      navigate(
        `/battle-lobby?mode=join&room=${normalizedCode}`,
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to join battle."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     START BATTLE
  ======================================================= */

  const startBattle = async () => {
    if (!cleanRoomCode) {
      setError(
        "Room code is missing."
      );
      return;
    }

    if (!isHost) {
      setError(
        "Only the host can start the battle."
      );
      return;
    }

    if (
      selectedProblems.length ===
      0
    ) {
      setError(
        "Please select at least one problem."
      );
      return;
    }

    try {
      setStarting(true);
      setError("");
      setMessage("");

      const problemIds =
        selectedProblems
          .map(String)
          .filter(Boolean)
          .slice(
            0,
            MAX_PROBLEMS
          );

      console.log(
        "Starting battle:",
        {
          roomCode:
            cleanRoomCode,
          battleId,
          problemIds,
        }
      );

      const response =
        await fetch(
          `${API_BASE}/battles/${cleanRoomCode}/start`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              problems:
                problemIds,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to start battle."
        );
      }

      const startedBattleId =
        extractBattleId(data) ||
        battleId;

      if (startedBattleId) {
        setBattleId(
          startedBattleId
        );

        localStorage.setItem(
          "battleId",
          startedBattleId
        );
      }

      localStorage.setItem(
        "battleRoomCode",
        cleanRoomCode
      );

      localStorage.setItem(
        "battleProblems",
        JSON.stringify(
          problemIds
        )
      );

      const battleData =
        data?.battle ||
        data?.room ||
        data?.data ||
        data;

      localStorage.setItem(
        "battleData",
        JSON.stringify(
          battleData
        )
      );

      /*
        Navigate directly.
        This avoids waiting for Socket.IO
        to decide when the host should move.
      */
      if (startedBattleId) {
        navigate(
          `/battle/${cleanRoomCode}/${startedBattleId}`
        );
      } else {
        navigate(
          `/battle/${cleanRoomCode}`
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Failed to start battle."
      );
    } finally {
      setStarting(false);
    }
  };

  /* =======================================================
     COPY INVITE
  ======================================================= */

  const copyInvite = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(
        inviteLink
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Could not copy invite link."
      );
    }
  };

  /* =======================================================
     TOGGLE PROBLEM
  ======================================================= */

  const toggleProblem = (
    problemId
  ) => {
    /*
      Player 2 cannot change problems.
    */
    if (!isHost) return;

    const id =
      String(problemId);

    setSelectedProblems(
      (current) => {
        /*
          Remove
        */
        if (
          current.includes(id)
        ) {
          return current.filter(
            (item) => item !== id
          );
        }

        /*
          Maximum 5
        */
        if (
          current.length >=
          MAX_PROBLEMS
        ) {
          setMessage(
            "You can select a maximum of 5 problems."
          );

          setTimeout(() => {
            setMessage("");
          }, 2500);

          return current;
        }

        /*
          Add
        */
        return [
          ...current,
          id,
        ];
      }
    );
  };

  /* =======================================================
     REFRESH
  ======================================================= */

  const refreshRoom = () => {
    if (!cleanRoomCode) return;

    loadRoom(
      cleanRoomCode,
      {
        forceHost: isHost,
      }
    );
  };

  /* =======================================================
     INITIAL URL ROOM
  ======================================================= */

  useEffect(() => {
    /*
      Plain /battle-lobby:
      show Create / Join screen.

      Do NOT reopen old room.
    */
    if (!urlRoomCode) {
      return;
    }

    setRoomCode(
      urlRoomCode
    );

    /*
      URL mode decides initial role.
    */
    if (urlMode === "host") {
      setIsHost(true);
    } else if (
      urlMode === "join"
    ) {
      setIsHost(false);
    }

    setRoomCreated(true);

    loadRoom(
      urlRoomCode,
      {
        forceHost:
          urlMode === "host",
      }
    );
  }, [
    urlRoomCode,
    urlMode,
  ]);

  /* =======================================================
     SOCKET.IO
  ======================================================= */

  useEffect(() => {
    if (!socket) return;

    const handleConnect =
      () => {
        setSocketConnected(true);

        if (!cleanRoomCode) {
          return;
        }

        socket.emit(
          "join-room",
          {
            roomCode:
              cleanRoomCode,

            userId:
              currentUserId,

            username:
              currentUser.username,

            email:
              currentUser.email,

            /*
              Send host information too.
            */
            isHost,
          }
        );
      };

    const handleDisconnect =
      () => {
        setSocketConnected(false);
      };

    const handleRoomUpdate =
      (data) => {
        if (!data) return;

        /*
          IMPORTANT:
          Never pass forceHost:false here
          for the host.

          Preserve current isHost.
        */
        applyBattleData(
          data,
          {
            roomCode:
              cleanRoomCode,

            forceHost:
              isHost,
          }
        );
      };

    const handlePlayersUpdate =
      (data) => {
        const list =
          data?.players ||
          data ||
          [];

        if (
          Array.isArray(list)
        ) {
          setPlayers(
            list
              .map(
                normalizePlayer
              )
              .filter(Boolean)
          );
        }
      };

    const handleBattleStarted =
      (data) => {
        const startedRoom =
          extractRoomCode(
            data,
            cleanRoomCode
          );

        const startedBattleId =
          extractBattleId(
            data
          ) || battleId;

        if (
          startedBattleId
        ) {
          setBattleId(
            startedBattleId
          );

          localStorage.setItem(
            "battleId",
            startedBattleId
          );
        }

        if (startedRoom) {
          localStorage.setItem(
            "battleRoomCode",
            startedRoom
          );

          if (
            startedBattleId
          ) {
            navigate(
              `/battle/${startedRoom}/${startedBattleId}`
            );
          } else {
            navigate(
              `/battle/${startedRoom}`
            );
          }
        }
      };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "room-update",
      handleRoomUpdate
    );

    socket.on(
      "room-state",
      handleRoomUpdate
    );

    socket.on(
      "players-update",
      handlePlayersUpdate
    );

    socket.on(
      "battle-started",
      handleBattleStarted
    );

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "room-update",
        handleRoomUpdate
      );

      socket.off(
        "room-state",
        handleRoomUpdate
      );

      socket.off(
        "players-update",
        handlePlayersUpdate
      );

      socket.off(
        "battle-started",
        handleBattleStarted
      );
    };
  }, [
    cleanRoomCode,
    currentUserId,
    currentUser.username,
    currentUser.email,
    isHost,
    battleId,
  ]);

  /* =======================================================
     LOAD PROBLEMS
  ======================================================= */

  useEffect(() => {
    const loadProblems =
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE}/problems`,
              {
                headers: token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {},
              }
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          const list =
            data?.problems ||
            data?.data ||
            data;

          if (
            Array.isArray(list)
          ) {
            setProblems(
              list
                .map(
                  normalizeProblem
                )
                .filter(Boolean)
            );
          }
        } catch {
          console.log(
            "Could not load problems."
          );
        }
      };

    loadProblems();
  }, [token]);

  /* =======================================================
     DISPLAY PROBLEMS
  ======================================================= */

  const displayProblems =
    problems.length > 0
      ? problems.slice(
          0,
          10
        )
      : [
          {
            id: "two-sum",
            title: "Two Sum",
            difficulty: "Easy",
          },
          {
            id: "valid-parentheses",
            title:
              "Valid Parentheses",
            difficulty: "Easy",
          },
          {
            id: "binary-search",
            title:
              "Binary Search",
            difficulty: "Easy",
          },
          {
            id: "best-time-stock",
            title:
              "Best Time to Buy and Sell Stock",
            difficulty: "Easy",
          },
          {
            id: "longest-substring",
            title:
              "Longest Substring Without Repeating Characters",
            difficulty: "Medium",
          },
        ];

  /* =======================================================
     CREATE / JOIN SCREEN
  ======================================================= */

  if (!roomCreated) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "linear-gradient(135deg,#0f172a,#111827)",
          color: "#fff",
          padding:
            "24px",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            maxWidth:
              "900px",
            margin:
              "0 auto",
          }}
        >
          <button
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "8px",
              padding:
                "10px 14px",
              background:
                "transparent",
              border:
                "1px solid #334155",
              color: "#fff",
              borderRadius:
                "10px",
              cursor:
                "pointer",
              marginBottom:
                "50px",
            }}
          >
            <ArrowLeft
              size={18}
            />
            Back
          </button>

          <div
            style={{
              textAlign:
                "center",
              marginBottom:
                "40px",
            }}
          >
            <h1
              style={{
                fontSize:
                  "36px",
                margin:
                  "0 0 10px",
              }}
            >
              Multiplayer Battle
            </h1>

            <p
              style={{
                color:
                  "#94a3b8",
                fontSize:
                  "16px",
              }}
            >
              Create a battle or
              join your friend's
              room.
            </p>
          </div>

          {error && (
            <div
              style={{
                background:
                  "#7f1d1d",
                border:
                  "1px solid #ef4444",
                color:
                  "#fecaca",
                padding:
                  "14px",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap:
                "24px",
            }}
          >
            {/* CREATE BATTLE */}

            <div
              style={{
                background:
                  "#1e293b",
                border:
                  "1px solid #334155",
                borderRadius:
                  "18px",
                padding:
                  "30px",
              }}
            >
              <div
                style={{
                  width:
                    "50px",
                  height:
                    "50px",
                  borderRadius:
                    "12px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#2563eb",
                  marginBottom:
                    "18px",
                }}
              >
                <Play
                  size={24}
                />
              </div>

              <h2>
                Create Battle
              </h2>

              <p
                style={{
                  color:
                    "#94a3b8",
                  lineHeight:
                    "1.6",
                }}
              >
                Create a new
                multiplayer room,
                select coding
                problems, and invite
                other players.
              </p>

              <button
                onClick={
                  createRoom
                }
                disabled={
                  loading
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "14px",
                  marginTop:
                    "15px",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    "#2563eb",
                  color:
                    "#fff",
                  fontWeight:
                    "700",
                  fontSize:
                    "15px",
                  cursor:
                    "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      style={{
                        verticalAlign:
                          "middle",
                        marginRight:
                          "8px",
                      }}
                    />
                    Creating...
                  </>
                ) : (
                  "Create Battle"
                )}
              </button>
            </div>

            {/* JOIN BATTLE */}

            <div
              style={{
                background:
                  "#1e293b",
                border:
                  "1px solid #334155",
                borderRadius:
                  "18px",
                padding:
                  "30px",
              }}
            >
              <div
                style={{
                  width:
                    "50px",
                  height:
                    "50px",
                  borderRadius:
                    "12px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#16a34a",
                  marginBottom:
                    "18px",
                }}
              >
                <Users
                  size={24}
                />
              </div>

              <h2>
                Join Battle
              </h2>

              <p
                style={{
                  color:
                    "#94a3b8",
                  lineHeight:
                    "1.6",
                }}
              >
                Ask the host for
                the room code and
                paste it below.
              </p>

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    "600",
                }}
              >
                Room Code
              </label>

              <input
                type="text"
                value={
                  joinCode
                }
                onChange={(
                  event
                ) =>
                  setJoinCode(
                    sanitizeRoomCode(
                      event.target
                        .value
                    )
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    joinRoom();
                  }
                }}
                placeholder="Paste host code e.g. 0435A1"
                maxLength={6}
                autoComplete="off"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #475569",
                  background:
                    "#0f172a",
                  color:
                    "#fff",
                  fontSize:
                    "18px",
                  fontWeight:
                    "700",
                  letterSpacing:
                    "3px",
                  outline:
                    "none",
                  textAlign:
                    "center",
                }}
              />

              <button
                onClick={
                  joinRoom
                }
                disabled={
                  loading ||
                  !joinCode
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "14px",
                  marginTop:
                    "15px",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    "#16a34a",
                  color:
                    "#fff",
                  fontWeight:
                    "700",
                  fontSize:
                    "15px",
                  cursor:
                    "pointer",
                  opacity:
                    !joinCode
                      ? 0.6
                      : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      style={{
                        verticalAlign:
                          "middle",
                        marginRight:
                          "8px",
                      }}
                    />
                    Joining...
                  </>
                ) : (
                  "Join Battle"
                )}
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign:
                "center",
              color:
                "#64748b",
              marginTop:
                "35px",
              fontSize:
                "13px",
            }}
          >
            Each question:
            15 minutes • 5
            questions • 75 minutes
            maximum
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ROOM LOBBY
  ======================================================= */

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(135deg,#0f172a,#111827)",
        color: "#fff",
        padding:
          "24px",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          maxWidth:
            "1100px",
          margin:
            "0 auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "16px",
            flexWrap:
              "wrap",
            marginBottom:
              "24px",
          }}
        >
          <button
            onClick={() =>
              navigate(
                "/battle-lobby"
              )
            }
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
              padding:
                "10px 14px",
              background:
                "transparent",
              border:
                "1px solid #334155",
              color:
                "#fff",
              borderRadius:
                "10px",
              cursor:
                "pointer",
            }}
          >
            <ArrowLeft
              size={18}
            />
            Back
          </button>

          <div
            style={{
              textAlign:
                "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize:
                  "28px",
              }}
            >
              Battle Lobby
            </h1>

            <p
              style={{
                margin:
                  "5px 0 0",
                color:
                  "#94a3b8",
              }}
            >
              15 minutes per
              question • 75 minutes
              total
            </p>
          </div>

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
              color:
                socketConnected
                  ? "#4ade80"
                  : "#f87171",
            }}
          >
            {socketConnected ? (
              <Wifi
                size={18}
              />
            ) : (
              <WifiOff
                size={18}
              />
            )}

            {socketConnected
              ? "Connected"
              : "Offline"}
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              background:
                "#7f1d1d",
              border:
                "1px solid #ef4444",
              color:
                "#fecaca",
              padding:
                "14px",
              borderRadius:
                "10px",
              marginBottom:
                "18px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background:
                "#14532d",
              border:
                "1px solid #22c55e",
              color:
                "#bbf7d0",
              padding:
                "14px",
              borderRadius:
                "10px",
              marginBottom:
                "18px",
            }}
          >
            {message}
          </div>
        )}

        {/* =================================================
            ROOM INFO
        ================================================= */}

        <div
          style={{
            background:
              "#1e293b",
            border:
              "1px solid #334155",
            borderRadius:
              "16px",
            padding:
              "22px",
            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap:
                "20px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                  marginBottom:
                    "5px",
                }}
              >
                ROOM CODE
              </div>

              <div
                style={{
                  fontSize:
                    "32px",
                  fontWeight:
                    "800",
                  letterSpacing:
                    "5px",
                }}
              >
                {cleanRoomCode}
              </div>

              {battleId && (
                <div
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "11px",
                    marginTop:
                      "6px",
                  }}
                >
                  Battle ID:{" "}
                  {battleId}
                </div>
              )}
            </div>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <button
                onClick={
                  copyInvite
                }
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  padding:
                    "10px 14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #475569",
                  background:
                    "#0f172a",
                  color:
                    "#fff",
                  cursor:
                    "pointer",
                }}
              >
                {copied ? (
                  <Check
                    size={17}
                  />
                ) : (
                  <Copy
                    size={17}
                  />
                )}

                {copied
                  ? "Copied"
                  : "Copy Invite"}
              </button>

              <button
                onClick={
                  refreshRoom
                }
                disabled={
                  refreshing
                }
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  padding:
                    "10px 14px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #475569",
                  background:
                    "#0f172a",
                  color:
                    "#fff",
                  cursor:
                    "pointer",
                }}
              >
                <RefreshCw
                  size={17}
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop:
                "14px",
              color:
                "#94a3b8",
              fontSize:
                "13px",
            }}
          >
            Share this room
            code with the other
            players:

            <strong
              style={{
                color:
                  "#fff",
                marginLeft:
                  "6px",
              }}
            >
              {cleanRoomCode}
            </strong>
          </div>
        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(300px,1fr))",
            gap:
              "20px",
          }}
        >
          {/* =================================================
              PLAYERS
          ================================================= */}

          <div
            style={{
              background:
                "#1e293b",
              border:
                "1px solid #334155",
              borderRadius:
                "16px",
              padding:
                "20px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "8px",
                marginBottom:
                  "18px",
              }}
            >
              <Users
                size={20}
              />

              <h2
                style={{
                  margin: 0,
                }}
              >
                Players
              </h2>

              <span
                style={{
                  marginLeft:
                    "auto",
                  background:
                    "#334155",
                  padding:
                    "4px 9px",
                  borderRadius:
                    "999px",
                }}
              >
                {players.length}
              </span>
            </div>

            {players.length ===
            0 ? (
              <p
                style={{
                  color:
                    "#94a3b8",
                }}
              >
                Waiting for
                players...
              </p>
            ) : (
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "10px",
                }}
              >
                {players.map(
                  (
                    player,
                    index
                  ) => {
                    const playerId =
                      String(
                        player.userId ||
                          player.id ||
                          ""
                      );

                    const playerIsHost =
                      playerId ===
                      String(
                        hostId
                      );

                    return (
                      <div
                        key={`${playerId}-${index}`}
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "10px",
                          padding:
                            "12px",
                          borderRadius:
                            "10px",
                          background:
                            "#0f172a",
                        }}
                      >
                        <span
                          style={{
                            width:
                              "10px",
                            height:
                              "10px",
                            borderRadius:
                              "50%",
                            background:
                              player.online
                                ? "#22c55e"
                                : "#64748b",
                          }}
                        />

                        <div
                          style={{
                            flex:
                              1,
                          }}
                        >
                          <div
                            style={{
                              fontWeight:
                                "600",
                            }}
                          >
                            {player.username ||
                              "Coder"}
                          </div>

                          {player.email && (
                            <div
                              style={{
                                color:
                                  "#64748b",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                player.email
                              }
                            </div>
                          )}
                        </div>

                        {playerIsHost && (
                          <Crown
                            size={
                              17
                            }
                            title="Host"
                          />
                        )}

                        {playerId ===
                          String(
                            currentUserId
                          ) &&
                          !playerIsHost && (
                            <span
                              style={{
                                fontSize:
                                  "11px",
                                color:
                                  "#94a3b8",
                              }}
                            >
                              You
                            </span>
                          )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* =================================================
              PROBLEM SELECTION
          ================================================= */}

          <div
            style={{
              background:
                "#1e293b",
              border:
                "1px solid #334155",
              borderRadius:
                "16px",
              padding:
                "20px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "10px",
              }}
            >
              <h2
                style={{
                  margin:
                    "0",
                }}
              >
                Select Problems
              </h2>

              {isHost && (
                <span
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#4ade80",
                    background:
                      "#14532d",
                    padding:
                      "5px 9px",
                    borderRadius:
                      "999px",
                  }}
                >
                  HOST
                </span>
              )}
            </div>

            <p
              style={{
                color:
                  "#94a3b8",
                fontSize:
                  "14px",
              }}
            >
              {isHost
                ? "Select up to 5 problems for the battle."
                : "The host selects the problems."}
            </p>

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap:
                  "10px",
                maxHeight:
                  "420px",
                overflowY:
                  "auto",
                paddingRight:
                  "3px",
              }}
            >
              {displayProblems.map(
                (
                  problem,
                  index
                ) => {
                  const id =
                    String(
                      problem.id
                    );

                  const checked =
                    selectedProblems.includes(
                      id
                    );

                  return (
                    <button
                      key={
                        `${id}-${index}`
                      }
                      onClick={() =>
                        toggleProblem(
                          id
                        )
                      }
                      disabled={
                        !isHost
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "10px",
                        textAlign:
                          "left",
                        padding:
                          "12px",
                        borderRadius:
                          "10px",
                        border:
                          checked
                            ? "1px solid #2563eb"
                            : "1px solid #334155",
                        background:
                          checked
                            ? "#172554"
                            : "#0f172a",
                        color:
                          "#fff",
                        cursor:
                          isHost
                            ? "pointer"
                            : "default",
                        opacity:
                          !isHost &&
                          !checked
                            ? 0.75
                            : 1,
                      }}
                    >
                      <div
                        style={{
                          width:
                            "24px",
                          height:
                            "24px",
                          minWidth:
                            "24px",
                          borderRadius:
                            "7px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            checked
                              ? "#2563eb"
                              : "#334155",
                        }}
                      >
                        {checked && (
                          <Check
                            size={
                              15
                            }
                          />
                        )}
                      </div>

                      <div
                        style={{
                          flex:
                            1,
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              "600",
                          }}
                        >
                          {problem.title ||
                            `Coding Problem ${
                              index +
                              1
                            }`}
                        </div>

                        <div
                          style={{
                            color:
                              "#94a3b8",
                            fontSize:
                              "12px",
                            marginTop:
                              "3px",
                            textTransform:
                              "capitalize",
                          }}
                        >
                          {problem.difficulty ||
                            "Medium"}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* SELECTED COUNT */}

            <div
              style={{
                marginTop:
                  "14px",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <span
                style={{
                  color:
                    selectedProblems.length ===
                    MAX_PROBLEMS
                      ? "#4ade80"
                      : "#94a3b8",
                  fontSize:
                    "13px",
                  fontWeight:
                    "600",
                }}
              >
                Selected:{" "}
                {
                  selectedProblems.length
                }{" "}
                / {MAX_PROBLEMS}
              </span>

              {isHost &&
                selectedProblems.length >
                  0 && (
                  <button
                    onClick={() =>
                      setSelectedProblems(
                        []
                      )
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#f87171",
                      cursor:
                        "pointer",
                      fontSize:
                        "12px",
                    }}
                  >
                    Clear
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* =================================================
            START BATTLE
        ================================================= */}

        <div
          style={{
            marginTop:
              "24px",
            background:
              "#1e293b",
            border:
              isHost
                ? "1px solid #166534"
                : "1px solid #334155",
            borderRadius:
              "16px",
            padding:
              "20px",
            textAlign:
              "center",
          }}
        >
          {isHost ? (
            <>
              <div
                style={{
                  marginBottom:
                    "14px",
                  color:
                    "#94a3b8",
                  fontSize:
                    "14px",
                }}
              >
                {selectedProblems.length ===
                0
                  ? "Select at least one problem to start the battle."
                  : `${selectedProblems.length} problem${
                      selectedProblems.length ===
                      1
                        ? ""
                        : "s"
                    } selected. Ready to start!`}
              </div>

              <button
                onClick={
                  startBattle
                }
                disabled={
                  starting ||
                  selectedProblems.length ===
                    0
                }
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "9px",
                  minWidth:
                    "250px",
                  padding:
                    "15px 28px",
                  border:
                    "none",
                  borderRadius:
                    "12px",
                  background:
                    selectedProblems.length >
                    0
                      ? "#16a34a"
                      : "#475569",
                  color:
                    "#fff",
                  fontSize:
                    "17px",
                  fontWeight:
                    "800",
                  cursor:
                    starting ||
                    selectedProblems.length ===
                      0
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    starting
                      ? 0.7
                      : 1,
                  boxShadow:
                    selectedProblems.length >
                    0
                      ? "0 8px 25px rgba(22,163,74,0.25)"
                      : "none",
                }}
              >
                {starting ? (
                  <>
                    <Loader2
                      size={
                        20
                      }
                      style={{
                        animation:
                          "spin 1s linear infinite",
                      }}
                    />
                    Starting Battle...
                  </>
                ) : (
                  <>
                    <Play
                      size={
                        20
                      }
                    />
                    Start Battle
                  </>
                )}
              </button>
            </>
          ) : (
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                gap:
                  "8px",
                color:
                  "#94a3b8",
              }}
            >
              <Loader2
                size={24}
              />

              <strong
                style={{
                  color:
                    "#fff",
                }}
              >
                Waiting for the
                host to start the
                battle...
              </strong>

              <span
                style={{
                  fontSize:
                    "13px",
                }}
              >
                The selected problems
                will appear when the
                battle starts.
              </span>
            </div>
          )}
        </div>

        {/* =================================================
            BATTLE INFO
        ================================================= */}

        <div
          style={{
            marginTop:
              "16px",
            textAlign:
              "center",
            color:
              "#64748b",
            fontSize:
              "12px",
          }}
        >
          5 questions maximum •
          15 minutes per question •
          75 minutes maximum battle
          duration
        </div>
      </div>

      {/* SPIN ANIMATION */}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default BattleLobby;