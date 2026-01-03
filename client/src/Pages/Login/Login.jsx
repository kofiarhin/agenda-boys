// client/components/Login.jsx
import { useState } from "react";

const Login = ({ onSubmit }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      if (onSubmit) await onSubmit(form);
    } catch (err) {
      setError(err?.message || "Login failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back. Please sign in.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert">{error}</div> : null}

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              className="auth-input"
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              className="auth-input"
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <div className="auth-footer">
            <span className="auth-footer-text">No account?</span>
            <a className="auth-link" href="/register">
              Create one
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
