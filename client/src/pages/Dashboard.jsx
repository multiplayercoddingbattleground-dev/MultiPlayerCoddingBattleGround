import { Link } from "react-router-dom";
import BattleLobby from "../components/BattleLobby";
function Dashboard() {
  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="badge">PLAYER DASHBOARD</p>
          <h1>Welcome, Coder 👋</h1>
          <p>Ready for your next coding battle?</p>
        </div>

        <Link to="/battle" className="primary-btn">
          ⚔ Start Battle
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>🏆 Wins</h3>
          <strong>12</strong>
        </div>

        <div className="stat-card">
          <h3>⚔ Battles</h3>
          <strong>20</strong>
        </div>

        <div className="stat-card">
          <h3>⭐ Rating</h3>
          <strong>1450</strong>
        </div>

        <div className="stat-card">
          <h3>🔥 Streak</h3>
          <strong>5</strong>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quick Battle</h2>

        <div className="battle-options">
          <div className="battle-option">
            <h3>⚡ Quick Match</h3>
            <p>Find an opponent instantly.</p>
            <button className="primary-btn">
              Find Opponent
            </button>
          </div>

          <div className="battle-option">
            <h3>👥 Private Battle</h3>
            <p>Challenge your friend.</p>
            <button className="secondary-btn">
              Create Room
            </button>
          </div>
        </div>
      </div>
    </section>
  );
  <BattleLobby />
}

export default Dashboard;