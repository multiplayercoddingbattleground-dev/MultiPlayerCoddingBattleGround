import { Link, useNavigate } from "react-router-dom";
import {
  Swords,
  Zap,
  Users,
  Trophy,
  Target,
  Star,
  Flame,
  ArrowRight,
  Code2,
  Plus,
  LogOut,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  // ============================================================
  // BATTLE NAVIGATION
  // ============================================================

  // Start Battle now opens the Battle Lobby.
  // The player can create a room or join an existing room there.
  const handleQuickMatch = () => {
    navigate("/battle-lobby?mode=quick");
  };

  // Private Battle opens the Battle Lobby in private-room mode.
  const handleCreateRoom = () => {
    navigate("/battle-lobby?mode=private");
  };

  return (
    <main className="dashboard-page">

      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">

          <div className="dashboard-badge">
            <span className="dashboard-badge-dot"></span>
            PLAYER DASHBOARD
          </div>

          <h1>
            Welcome back,
            <span> Coder 👋</span>
          </h1>

          <p>
            Sharpen your skills, challenge your friends,
            and climb the coding battle leaderboard.
          </p>

          <div className="dashboard-actions">

            {/* START BATTLE */}
            <button
              className="dashboard-primary-btn"
              onClick={handleQuickMatch}
            >
              <Swords size={19} />
              Start Battle
              <ArrowRight size={17} />
            </button>

            {/* CREATE PRIVATE ROOM */}
            <button
              className="dashboard-secondary-btn"
              onClick={handleCreateRoom}
            >
              <Users size={18} />
              Create Private Room
            </button>

          </div>
        </div>

        {/* CODE DECORATION */}
        <div className="dashboard-code-decoration">
          <div className="code-window">

            <div className="code-window-header">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="code-content">
              <p>
                <span className="code-purple">function</span>{" "}
                <span className="code-blue">battle</span>() {"{"}
              </p>

              <p className="code-indent">
                <span className="code-purple">const</span>{" "}
                opponent ={" "}
                <span className="code-green">
                  findOpponent
                </span>
                ();
              </p>

              <p className="code-indent">
                <span className="code-purple">return</span>{" "}
                <span className="code-orange">
                  challenge
                </span>
                (opponent);
              </p>

              <p>{"}"}</p>

              <p className="code-cursor">_</p>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          STATS
      ====================================================== */}
      <section className="dashboard-stats">

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon trophy">
            <Trophy size={21} />
          </div>

          <div>
            <span>Wins</span>
            <strong>12</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon battles">
            <Swords size={21} />
          </div>

          <div>
            <span>Battles</span>
            <strong>20</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon rating">
            <Star size={21} />
          </div>

          <div>
            <span>Rating</span>
            <strong>1450</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon streak">
            <Flame size={21} />
          </div>

          <div>
            <span>Win Streak</span>
            <strong>5</strong>
          </div>
        </div>

      </section>

      {/* ======================================================
          BATTLE CENTER
      ====================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-header">

          <div>
            <span className="dashboard-section-label">
              BATTLE CENTER
            </span>

            <h2>Choose your battle</h2>

            <p>
              Jump into a quick match or create a private
              room for your friends.
            </p>
          </div>

          <div className="dashboard-section-icon">
            <Target size={24} />
          </div>

        </div>

        <div className="dashboard-battle-grid">

          {/* ==================================================
              QUICK MATCH
          ================================================== */}
          <div className="dashboard-battle-card quick">

            <div className="battle-card-top">

              <div className="battle-card-icon">
                <Zap size={24} />
              </div>

              <span className="battle-card-tag">
                FAST
              </span>

            </div>

            <h3>Quick Match</h3>

            <p>
              Find an opponent and start coding immediately.
              No room setup required.
            </p>

            <div className="battle-card-info">

              <span>
                <Code2 size={15} />
                Coding Challenge
              </span>

              <span>
                <Users size={15} />
                2 Players
              </span>

            </div>

            <button
              className="battle-card-button"
              onClick={handleQuickMatch}
            >
              Find Opponent
              <ArrowRight size={17} />
            </button>

          </div>

          {/* ==================================================
              PRIVATE BATTLE
          ================================================== */}
          <div className="dashboard-battle-card private">

            <div className="battle-card-top">

              <div className="battle-card-icon">
                <Users size={24} />
              </div>

              <span className="battle-card-tag">
                FRIENDS
              </span>

            </div>

            <h3>Private Battle</h3>

            <p>
              Create a private room and invite your friends
              using a unique battle code.
            </p>

            <div className="battle-card-info">

              <span>
                <Code2 size={15} />
                Custom Room
              </span>

              <span>
                <Users size={15} />
                Invite Friends
              </span>

            </div>

            <button
              className="battle-card-button"
              onClick={handleCreateRoom}
            >
              Create Room
              <Plus size={17} />
            </button>

          </div>

        </div>
      </section>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-header">

          <div>
            <span className="dashboard-section-label">
              YOUR PROGRESS
            </span>

            <h2>Recent activity</h2>
          </div>

          <Link
            to="/results"
            className="dashboard-view-link"
          >
            View results
            <ArrowRight size={16} />
          </Link>

        </div>

        <div className="dashboard-activity">

          <div className="activity-item">

            <div className="activity-icon win">
              <Trophy size={18} />
            </div>

            <div className="activity-details">
              <strong>Battle Victory</strong>
              <span>Won a coding battle</span>
            </div>

            <div className="activity-score">
              +25
            </div>

          </div>

          <div className="activity-item">

            <div className="activity-icon battle">
              <Swords size={18} />
            </div>

            <div className="activity-details">
              <strong>Coding Battle</strong>
              <span>
                Completed JavaScript challenge
              </span>
            </div>

            <div className="activity-score neutral">
              18/20
            </div>

          </div>

          <div className="activity-item">

            <div className="activity-icon streak">
              <Flame size={18} />
            </div>

            <div className="activity-details">
              <strong>5 Day Streak</strong>
              <span>
                Keep the momentum going!
              </span>
            </div>

            <div className="activity-score">
              🔥
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================
          CTA
      ====================================================== */}
      <section className="dashboard-cta">

        <div>
          <span>READY TO COMPETE?</span>

          <h2>
            Your next victory is waiting.
          </h2>

          <p>
            Challenge yourself and prove your coding skills.
          </p>
        </div>

        <button
          className="dashboard-cta-button"
          onClick={handleQuickMatch}
        >
          <Swords size={18} />
          Start Coding Battle
        </button>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <div className="dashboard-footer">

        <button
          className="dashboard-logout"
          onClick={() => navigate("/home")}
        >
          <LogOut size={16} />
          Back to Home
        </button>

      </div>

    </main>
  );
}

export default Dashboard; 