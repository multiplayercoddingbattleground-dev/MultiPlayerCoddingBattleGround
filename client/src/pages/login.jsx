import React, { useState } from "react";
import { Code2, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Login failed. Please check your credentials."
        );
      }

      /*
       * Support the response formats commonly used by the backend:
       *
       * {
       *   token,
       *   user
       * }
       *
       * or
       *
       * {
       *   data: {
       *     token,
       *     user
       *   }
       * }
       */

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

      if (!token) {
        throw new Error(
          "Login succeeded, but the server did not return an authentication token."
        );
      }

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        /*
         * Keep a minimal user object so the dashboard can still
         * identify the logged-in account if the backend only
         * returns a token.
         */
        localStorage.setItem(
          "user",
          JSON.stringify({
            email,
          })
        );
      }

      localStorage.setItem("isAuthenticated", "true");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

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

        {/* Login card */}
        <section className="cb-auth-card">
          <h2>Sign in</h2>

          <div className="cb-auth-card-description">
            Enter your account details to continue coding.
          </div>

          {error && (
            <div className="cb-auth-error" role="alert">
              {error}
            </div>
          )}

          <form className="cb-auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="cb-form-group">
              <label className="cb-form-label" htmlFor="login-email">
                Email address
              </label>

              <div className="cb-input-wrapper">
                <Mail className="cb-input-icon" size={17} />

                <input
                  id="login-email"
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
              <label className="cb-form-label" htmlFor="login-password">
                Password
              </label>

              <div className="cb-input-wrapper">
                <Lock className="cb-input-icon" size={17} />

                <input
                  id="login-password"
                  className="cb-input with-icon"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
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

            {/* Submit */}
            <button
              type="submit"
              className="cb-btn cb-btn-primary cb-btn-lg cb-auth-submit"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Register */}
          <div className="cb-auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create an account</Link>
          </div>
        </section>

        {/* Small footer */}
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

export default Login;