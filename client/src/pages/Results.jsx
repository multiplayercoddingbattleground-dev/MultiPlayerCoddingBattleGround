import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Clock,
  CheckCircle,
  ArrowLeft,
  Medal,
  Loader2,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function getUserId() {
  const possibleUser =
    localStorage.getItem("user") ||
    localStorage.getItem("currentUser");

  if (!possibleUser) return "";

  try {
    const user = JSON.parse(possibleUser);

    return (
      user?._id ||
      user?.id ||
      user?.userId ||
      ""
    );
  } catch {
    return "";
  }
}

function formatTime(seconds) {
  const total = Math.max(
    0,
    Number(seconds) || 0
  );

  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
}

function Results() {
  const navigate = useNavigate();
  const location = useLocation();

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Battle page sends:
   *
   * /results?room=ABC123
   */

  const roomCode = useMemo(() => {
    const params = new URLSearchParams(
      location.search
    );

    return (
      params.get("room") ||
      params.get("roomCode") ||
      ""
    )
      .trim()
      .toUpperCase();
  }, [location.search]);

  /*
   * --------------------------------------------------
   * LOAD FINAL BATTLE
   * --------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        if (!roomCode) {
          throw new Error(
            "Battle room code is missing."
          );
        }

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const response = await fetch(
          `${API_URL}/battles/${encodeURIComponent(
            roomCode
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load battle results."
          );
        }

        if (!cancelled) {
          setBattle(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "RESULTS LOAD ERROR:",
            err
          );

          setError(
            err.message ||
              "Failed to load battle results."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  /*
   * --------------------------------------------------
   * BUILD SCOREBOARD
   * --------------------------------------------------
   */

  const scoreboard = useMemo(() => {
    if (!battle) return [];

    const scores = Array.isArray(
      battle.scores
    )
      ? battle.scores
      : [];

    const players = Array.isArray(
      battle.players
    )
      ? battle.players
      : [];

    const result = players.map(
      (player) => {
        const playerId = String(
          player?._id ||
            player?.id ||
            ""
        );

        const score = scores.find(
          (item) =>
            String(
              item?.user?._id ||
                item?.user ||
                ""
            ) === playerId
        );

        return {
          id: playerId,

          name:
            player?.name ||
            player?.username ||
            "Player",

          username:
            player?.username ||
            "",

          points:
            Number(
              score?.points
            ) || 0,

          solvedProblems:
            Array.isArray(
              score?.solvedProblems
            )
              ? score.solvedProblems
              : [],
        };
      }
    );

    /*
     * In case a score exists for a user
     * who is not currently in players.
     */

    scores.forEach((score) => {
      const scoreUserId =
        String(
          score?.user?._id ||
            score?.user ||
            ""
        );

      if (
        !result.some(
          (player) =>
            player.id ===
            scoreUserId
        )
      ) {
        result.push({
          id: scoreUserId,

          name:
            score?.user?.name ||
            score?.user?.username ||
            "Player",

          username:
            score?.user?.username ||
            "",

          points:
            Number(
              score?.points
            ) || 0,

          solvedProblems:
            Array.isArray(
              score?.solvedProblems
            )
              ? score.solvedProblems
              : [],
        });
      }
    });

    return result.sort(
      (a, b) =>
        b.points - a.points
    );
  }, [battle]);

  /*
   * --------------------------------------------------
   * WINNER
   * --------------------------------------------------
   */

  const winner = useMemo(() => {
    if (!scoreboard.length) {
      return null;
    }

    /*
     * Prefer server winner if available.
     */

    if (battle?.winner) {
      const winnerId = String(
        battle.winner?._id ||
          battle.winner
      );

      const serverWinner =
        scoreboard.find(
          (player) =>
            player.id === winnerId
        );

      if (serverWinner) {
        return serverWinner;
      }
    }

    /*
     * Otherwise highest score wins.
     */

    return scoreboard[0];
  }, [battle, scoreboard]);

  /*
   * --------------------------------------------------
   * CURRENT USER
   * --------------------------------------------------
   */

  const currentUserId =
    getUserId();

  const currentPlayer =
    scoreboard.find(
      (player) =>
        player.id ===
        String(currentUserId)
    ) || scoreboard[0];

  /*
   * --------------------------------------------------
   * BATTLE STATISTICS
   * --------------------------------------------------
   */

  const battleTime = useMemo(() => {
    if (!battle?.startTime) {
      return 0;
    }

    const start = new Date(
      battle.startTime
    ).getTime();

    const end = battle?.endTime
      ? new Date(
          battle.endTime
        ).getTime()
      : Date.now();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor(
        (end - start) / 1000
      )
    );
  }, [battle]);

  const totalSolved = scoreboard.reduce(
    (total, player) =>
      total +
      player.solvedProblems.length,
    0
  );

  const totalProblems =
    Array.isArray(
      battle?.problems
    )
      ? battle.problems.length
      : 0;

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div
        className="results-page"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <Loader2
          size={40}
          className="results-spinner"
        />

        <h2>
          Loading Battle Results...
        </h2>

        <p>
          Room: {roomCode || "Unknown"}
        </p>

        <style>
          {`
            .results-spinner {
              animation: resultsSpin 1s linear infinite;
            }

            @keyframes resultsSpin {
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

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */

  if (error) {
    return (
      <div
        className="results-page"
        style={{
          minHeight: "100vh",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <Trophy size={48} />

        <h1>
          Unable to Load Results
        </h1>

        <p>{error}</p>

        <button
          onClick={() =>
            navigate(
              "/battle-lobby"
            )
          }
          className="back-btn"
        >
          <ArrowLeft size={18} />
          Back to Lobby
        </button>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * MAIN RESULTS UI
   * --------------------------------------------------
   */

  return (
    <div className="results-page">

      {/* Header */}

      <div className="results-header">
        <Trophy size={32} />

        <h1>
          Battle Complete
        </h1>

        <p>
          Final results for room{" "}
          <strong>
            {roomCode}
          </strong>
        </p>
      </div>

      {/* Winner */}

      {winner && (
        <div className="winner-card">

          <div className="winner-icon">
            🏆
          </div>

          <p className="winner-label">
            WINNER
          </p>

          <h2>
            {winner.name}
          </h2>

          <div className="winner-score">
            {winner.points} Points
          </div>

        </div>
      )}

      {/* Draw */}

      {winner &&
        scoreboard.length > 1 &&
        scoreboard[0].points ===
          scoreboard[1].points && (
          <div
            style={{
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            <strong>
              🤝 It's a Draw!
            </strong>
          </div>
        )}

      {/* Scoreboard */}

      <div className="scoreboard">

        {scoreboard.map(
          (player, index) => (
            <div
              key={
                player.id ||
                index
              }
              className={`score-card ${
                index === 0
                  ? "first"
                  : index === 1
                  ? "second"
                  : ""
              }`}
            >
              <Medal size={25} />

              <h3>
                {index === 0
                  ? "1st Place"
                  : index === 1
                  ? "2nd Place"
                  : `${index + 1}th Place`}
              </h3>

              <p>
                {player.name}

                {player.id ===
                  String(
                    currentUserId
                  ) && (
                  <span>
                    {" "}
                    (You)
                  </span>
                )}
              </p>

              <strong>
                {player.points}
              </strong>

              <small>
                {player.solvedProblems.length}{" "}
                solved
              </small>
            </div>
          )
        )}

      </div>

      {/* Battle Statistics */}

      <div className="stats-card">

        <h2>
          Battle Statistics
        </h2>

        <div className="stats-grid">

          <div className="stat">
            <CheckCircle size={22} />

            <span>
              Problems Solved
            </span>

            <strong>
              {totalSolved}
              {totalProblems > 0
                ? ` / ${
                    totalProblems *
                    scoreboard.length
                  }`
                : ""}
            </strong>
          </div>

          <div className="stat">
            <Clock size={22} />

            <span>
              Battle Time
            </span>

            <strong>
              {formatTime(
                battleTime
              )}
            </strong>
          </div>

          <div className="stat">
            <Trophy size={22} />

            <span>
              Your Score
            </span>

            <strong>
              {currentPlayer?.points ||
                0}
            </strong>
          </div>

          <div className="stat">
            <Users size={22} />

            <span>
              Players
            </span>

            <strong>
              {scoreboard.length}
            </strong>
          </div>

        </div>
      </div>

      {/* Buttons */}

      <div className="results-buttons">

        <button
          onClick={() =>
            navigate(
              "/battle-lobby"
            )
          }
          className="back-btn"
        >
          <ArrowLeft size={18} />
          Back to Lobby
        </button>

        <button
          onClick={() =>
            navigate(
              "/battle-lobby"
            )
          }
          className="rematch-btn"
        >
          ⚔️ Rematch
        </button>

      </div>

    </div>
  );
}

export default Results;