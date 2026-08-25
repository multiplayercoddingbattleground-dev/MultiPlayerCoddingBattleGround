import React from "react";
import { Trophy, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function Results() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const winnerName = state?.winnerName || "Unknown";
  const isWinner = Boolean(state?.isWinner);
  const submission = state?.submission;
  const testsPassed = submission
    ? `${submission.testCasesPassed} / ${submission.totalTestCases}`
    : "—";

  return (
    <div className="results-page">

      {/* Header */}
      <div className="results-header">
        <Trophy size={32} />
        <h1>Battle Complete</h1>
        <p>
          {state
            ? isWinner
              ? "Great job! You solved it first."
              : `${winnerName} solved it first this time.`
            : "Great job! Here are the final results."}
        </p>
      </div>

      {/* Winner */}
      <div className="winner-card">

        <div className="winner-icon">
          🏆
        </div>

        <p className="winner-label">
          WINNER
        </p>

        <h2>{winnerName}</h2>

        {submission && (
          <div className="winner-score">
            {submission.status === "accepted" ? "Accepted" : submission.status}
          </div>
        )}

      </div>

      {/* Battle Statistics */}
      <div className="stats-card">

        <h2>Battle Statistics</h2>

        <div className="stats-grid">

          <div className="stat">
            <CheckCircle size={22} />

            <span>Tests Passed</span>

            <strong>{testsPassed}</strong>
          </div>

          <div className="stat">
            <Clock size={22} />

            <span>Room Code</span>

            <strong>{state?.roomCode || "—"}</strong>
          </div>

          <div className="stat">
            <Trophy size={22} />

            <span>Result</span>

            <strong>{isWinner ? "Victory" : "Defeat"}</strong>
          </div>

        </div>

      </div>

      {/* Buttons */}
      <div className="results-buttons">

        <button
          onClick={() => navigate("/battle-lobby")}
          className="back-btn"
        >
          <ArrowLeft size={18} />
          Back to Lobby
        </button>

        <button
          onClick={() => navigate("/battle-lobby")}
          className="rematch-btn"
        >
          ⚔️ Rematch
        </button>

      </div>

    </div>
  );
}

export default Results;
