import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

function LogoIcon() {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: "var(--accent)" }}
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M 4 4 L 12 4 L 20 12 L 12 20 L 4 12 Z" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await login({ email, password });
      localStorage.setItem("token", access_token);
      navigate("/workspaces");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "#16171d",
    border: "1px solid #2d2d3a",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#f0f0f0",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid var(--accent)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(94,106,210,0.2)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid #2d2d3a";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#16171d" }}
    >
      <div className="w-full px-4" style={{ maxWidth: "400px" }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <LogoIcon />
          <span className="text-xl font-semibold text-white">Linear Clone</span>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ backgroundColor: "#1e1f26", border: "1px solid #2d2d3a" }}
        >
          <h1 className="text-lg font-semibold text-white mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#8b8b8b" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#8b8b8b" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent)";
              }}
            >
              {loading ? "Signing in..." : "Continue with email"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
