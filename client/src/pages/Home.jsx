import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="badge">⚡ MULTIPLAYER CODING BATTLE</p>

        <h1>
          Code.
          <span> Compete.</span>
          <br />
          Conquer.
        </h1>

        <p className="hero-description">
          Challenge your friends, solve coding problems in real-time,
          and prove who is the better programmer.
        </p>

        <div className="hero-buttons">
          <Link to="/register" className="primary-btn">
            Start Battle
          </Link>

          <Link to="/login" className="secondary-btn">
            Login
          </Link>
        </div>
      </div>

      <div className="hero-card">
        <div className="code-header">
          <span>●</span>
          <span>●</span>
          <span>●</span>
        </div>

        <pre>
{`function solve() {
  const result = battle();

  if (result === "WIN") {
    console.log("🏆 Victory!");
  }
}`}
        </pre>
      </div>
    </section>
  );
}

export default Home;