import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">

      <Link to="/" className="navbar-logo">
        ⚡ CodeBattle
      </Link>

      <div className="navbar-links">

        <Link
          to="/"
          className={location.pathname === "/" ? "active" : ""}
        >
          Home
        </Link>

        <Link
          to="/dashboard"
          className={
            location.pathname === "/dashboard" ? "active" : ""
          }
        >
          Dashboard
        </Link>

        <Link
          to="/battle/ABC123"
          className={
            location.pathname.startsWith("/battle")
              ? "active"
              : ""
          }
        >
          Battle
        </Link>

      </div>

      <div className="navbar-user">
        <span>👤 Lakshman</span>
      </div>

    </nav>
  );
}

export default Navbar;