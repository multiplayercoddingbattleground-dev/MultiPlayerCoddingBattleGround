import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalBattles = (user?.wins || 0) + (user?.losses || 0);

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="badge">PLAYER DASHBOARD</p>
          <h1>Welcome, {user?.name || "Coder"} 👋</h1>
          <p>Ready for your next coding battle?</p>
        </div>

        <Link to="/battle-lobby" className="primary-btn">
          ⚔ Start Battle
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>🏆 Wins</h3>
          <strong>{user?.wins ?? 0}</strong>
        </div>

        <div className="stat-card">
          <h3>⚔ Battles</h3>
          <strong>{totalBattles}</strong>
        </div>

        <div className="stat-card">
          <h3>⭐ Rating</h3>
          <strong>{user?.rating ?? 1200}</strong>
        </div>

        <div className="stat-card">
          <h3>💔 Losses</h3>
          <strong>{user?.losses ?? 0}</strong>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quick Battle</h2>

        <div className="battle-options">
          <div className="battle-option">
            <h3>⚡ Quick Match</h3>
            <p>Find an opponent instantly.</p>
            <button
              className="primary-btn"
              onClick={() => navigate("/battle-lobby")}
            >
              Find Opponent
            </button>
          </div>

          <div className="battle-option">
            <h3>👥 Private Battle</h3>
            <p>Challenge your friend.</p>
            <button
              className="secondary-btn"
              onClick={() => navigate("/battle-lobby")}
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
