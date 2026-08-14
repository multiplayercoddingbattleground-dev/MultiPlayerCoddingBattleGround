import { Link } from "react-router-dom";

function Results() {
  return (
    <section className="results-page">
      <div className="result-card">

        <div className="winner-icon">
          🏆
        </div>

        <p className="badge">BATTLE COMPLETE</p>

        <h1>Victory!</h1>

        <p>
          Congratulations! You defeated your opponent.
        </p>

        <div className="result-stats">
          <div>
            <span>Score</span>
            <strong>950</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>12:45</strong>
          </div>

          <div>
            <span>Problems</span>
            <strong>8/10</strong>
          </div>
        </div>

        <Link to="/dashboard" className="primary-btn">
          Back to Dashboard
        </Link>

      </div>
    </section>
  );
}

export default Results;