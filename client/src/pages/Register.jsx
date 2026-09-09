import React, { useState } from "react";
import {
  ArrowRight,
  Code2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (username.length < 3) {
      setError("Username must contain at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Backend requires "name".
          // We keep the UI field as "Username".
          name: username,

          // Also send username because the User model uses it.
          username,

          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      console.log("Registration response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Registration failed. Please try again."
        );
      }

      const token =
        data.token ||
        data.accessToken ||
        data.data?.token ||
        data.data?.accessToken;

      const user =
        data.user ||
        data.data?.user ||
        data.data?.data?.user ||
        null;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("isAuthenticated", "true");

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: username,
              username,
              email,
            })
          );
        }

        navigate("/dashboard", { replace: true });
        return;
      }

      setSuccess(
        "Account created successfully. Redirecting you to login..."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registeredEmail: email,
          },
        });
      }, 900);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.message ||
          "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cb-auth-page">
      <div className="cb-auth-wrapper">
        {/* Brand */}
        <div className="cb-auth-brand">
          <div className="cb-brand-icon">
            <Code2 size={23} strokeWidth={2.4} />
          </div>

          <h1>CodeBattle</h1>

          <p>Competitive programming battles</p>
        </div>

        {/* Register card */}
        <section className="cb-auth-card">
          <h2>Create your account</h2>

          <div className="cb-auth-card-description">
            Join CodeBattle and compete with other programmers.
          </div>

          {error && (
            <div className="cb-auth-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="cb-alert cb-alert-success" role="status">
              {success}
            </div>
          )}

          <form className="cb-auth-form" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="cb-form-group">
              <label
                className="cb-form-label"
                htmlFor="register-username"
              >
                Username
              </label>

              <div className="cb-input-wrapper">
                <User className="cb-input-icon" size={17} />

                <input
                  id="register-username"
                  className="cb-input with-icon"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  autoComplete="username"
                  disabled={loading}
                  minLength={3}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="cb-form-group">
              <label
                className="cb-form-label"
                htmlFor="register-email"
              >
                Email address
              </label>

              <div className="cb-input-wrapper">
                <Mail className="cb-input-icon" size={17} />

                <input
                  id="register-email"
                  className="cb-input with-icon"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="cb-form-group">
              <label
                className="cb-form-label"
                htmlFor="register-password"
              >
                Password
              </label>

              <div className="cb-input-wrapper">
                <Lock className="cb-input-icon" size={17} />

                <input
                  id="register-password"
                  className="cb-input with-icon"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#737b87",
                    cursor: "pointer",
                    width: "34px",
                    height: "34px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="cb-form-group">
              <label
                className="cb-form-label"
                htmlFor="register-confirm-password"
              >
                Confirm password
              </label>

              <div className="cb-input-wrapper">
                <Lock className="cb-input-icon" size={17} />

                <input
                  id="register-confirm-password"
                  className="cb-input with-icon"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#737b87",
                    cursor: "pointer",
                    width: "34px",
                    height: "34px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="cb-btn cb-btn-primary cb-btn-lg cb-auth-submit"
              disabled={loading}
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="cb-auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </div>
        </section>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "18px",
            color: "#8b929c",
            fontSize: "11px",
          }}
        >
          CodeBattle · Competitive coding platform
        </div>
      </div>
    </main>
  );
}

export default Register;
