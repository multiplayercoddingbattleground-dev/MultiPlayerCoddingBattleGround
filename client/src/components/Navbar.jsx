import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
          to="/battle-lobby"
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
        {isAuthenticated ? (
          <>
            <span>👤 {user.name}</span>
            <button className="navbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>

    </nav>
  );
}

export default Navbar;
