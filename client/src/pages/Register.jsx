import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Join the coding battle arena.
        </p>

        <form>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password"
          />

          <button type="submit" className="primary-btn full-btn">
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;