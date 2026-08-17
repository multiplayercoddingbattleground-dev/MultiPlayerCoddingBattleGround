import React from "react";
import { Trophy, Clock, CheckCircle, ArrowLeft, Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Results() {
  const navigate = useNavigate();

  return (
    <div className="results-page">

      {/* Header */}
      <div className="results-header">
        <Trophy size={32} />
        <h1>Battle Complete</h1>
        <p>Great job! Here are the final results.</p>
      </div>

      {/* Winner */}
      <div className="winner-card">

        <div className="winner-icon">
          🏆
        </div>

        <p className="winner-label">
          WINNER
        </p>

        <h2>Lakshman</h2>

        <div className="winner-score">
          850 Points
        </div>

      </div>

      {/* Scoreboard */}
      <div className="scoreboard">

        <div className="score-card first">
          <Medal size={25} />

          <h3>1st Place</h3>

          <p>Lakshman</p>

          <strong>850</strong>
        </div>

        <div className="score-card second">
          <Medal size={25} />

          <h3>2nd Place</h3>

          <p>Cypher_X</p>

          <strong>720</strong>
        </div>

      </div>

      {/* Battle Statistics */}
      <div className="stats-card">

        <h2>Battle Statistics</h2>

        <div className="stats-grid">

          <div className="stat">
            <CheckCircle size={22} />

            <span>Tests Passed</span>

            <strong>9 / 10</strong>
          </div>

          <div className="stat">
            <Clock size={22} />

            <span>Battle Time</span>

            <strong>12:45</strong>
          </div>

          <div className="stat">
            <Trophy size={22} />

            <span>Score</span>

            <strong>850</strong>
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