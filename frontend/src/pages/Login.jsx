import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06030f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      color: "white",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background Image - right side */}
      <div style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "55%",
        backgroundImage: "url('/assets/auth-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, black 70%)",
        maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 30%, black 70%)",
        opacity: 0.9,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-80px", left: "-80px",
        width: "350px", height: "350px",
        background: "rgba(236,72,153,0.07)",
        borderRadius: "50%", filter: "blur(120px)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Main layout */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: "1100px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        padding: "0 40px",
        gap: "0",
      }}>
        {/* LEFT: Form */}
        <div style={{ maxWidth: "440px", paddingRight: "20px" }}>
          {/* Title */}
          <h1 style={{
            fontSize: "2.6rem",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "10px",
            fontFamily: "'Outfit', sans-serif",
          }}>
            Welcome Back 🖐
          </h1>
          <p style={{
            color: "#94a3b8",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}>
            Login to continue protecting and monitoring emergency safety activities.
          </p>

          {error && (
            <div style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: "7px",
              }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={17}
                  style={{
                    position: "absolute", left: "14px",
                    top: "50%", transform: "translateY(-50%)",
                    color: "#64748b", pointerEvents: "none",
                  }}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(10,14,30,0.85)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    padding: "12px 44px 12px 42px",
                    color: "white",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(236,72,153,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
                />
                {isEmailValid && (
                  <Check
                    size={16}
                    style={{
                      position: "absolute", right: "14px",
                      top: "50%", transform: "translateY(-50%)",
                      color: "#22c55e",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: "7px",
              }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={17}
                  style={{
                    position: "absolute", left: "14px",
                    top: "50%", transform: "translateY(-50%)",
                    color: "#64748b", pointerEvents: "none",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(15,20,40,0.8)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    padding: "13px 44px 13px 42px",
                    color: "white",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(236,72,153,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "14px",
                    top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "#64748b", cursor: "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{
                display: "flex", alignItems: "center", gap: "8px",
                cursor: "pointer", color: "#94a3b8", fontSize: "0.875rem",
              }}>
                <input
                  type="checkbox"
                  style={{ width: "15px", height: "15px", accentColor: "#ec4899", cursor: "pointer" }}
                />
                Remember me
              </label>
              <a href="#forgot-password" style={{
                color: "#f472b6", fontWeight: 600,
                fontSize: "0.875rem", textDecoration: "none",
              }}>
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "8px",
                background: "linear-gradient(to right, #ec4899, #a855f7)",
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.65 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 0 20px rgba(236,72,153,0.25)",
              }}
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Sign up link */}
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{ color: "#f472b6", fontWeight: 700, textDecoration: "none" }}>
              Create Account
            </Link>
          </p>
        </div>

        {/* RIGHT: empty space for background image */}
        <div style={{ height: "580px" }} />
      </div>
    </div>
  );
};

export default Login;
