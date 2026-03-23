import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser, signupUser, googleAuthLogin } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address (e.g. user@example.com).");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (tab === "signup" && !form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (tab === "login") {
        res = await loginUser({ email: form.email, password: form.password });
      } else {
        res = await signupUser({ name: form.name, email: form.email, password: form.password });
      }

      // Store token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data?.user || res.data.user || {}));

      if (tab === "signup") {
        setSuccess("Account created! Redirecting…");
      }
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await googleAuthLogin({ credential: credentialResponse.credential });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.data?.user || {}));
      setSuccess("Google sign-in successful! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed. Please try again.");
  };

  return (
    <div style={s.page}>
      <div style={s.blobGreen} />
      <div style={s.blobBlue} />

      {/* NAV */}
      <nav style={s.nav}>
        <button style={s.logoBtn} onClick={() => navigate("/")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span style={s.logoText}>EnergyLens</span>
        </button>
      </nav>

      {/* CARD */}
      <div style={s.card}>
        <div style={s.tabGroup}>
          {["login", "signup"].map((t) => (
            <button
              key={t}
              style={tab === t ? { ...s.tabBtn, ...s.tabActive } : s.tabBtn}
              onClick={() => setTab(t)}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <h3 style={s.formTitle}>
          {tab === "login" ? "Welcome back " : "Create your account"}
        </h3>
        <p style={s.formSub}>
          {tab === "login" ? "Enter your credentials to continue." : "Join thousands of smart energy households."}
        </p>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && (
            <div style={s.errorBanner}>
              <span style={s.errorIcon}>⚠</span> {error}
            </div>
          )}
          {success && (
            <div style={s.successBanner}>
              <span>✓</span> {success}
            </div>
          )}
          {tab === "signup" && (
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handleChange} style={s.input} required />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} style={s.input} required />
          </div>
          <div style={s.field}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={s.label}>Password</label>
              {tab === "login" && <span style={s.forgot}>Forgot?</span>}
            </div>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} style={s.input} required />
          </div>
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? <span style={s.spinner} /> : tab === "login" ? "Log In →" : "Create Account →"}
          </button>
        </form>

        {/* Google Sign-In */}
        <div style={s.divider}>
          <div style={s.divLine} /><span style={s.divText}>OR</span><div style={s.divLine} />
        </div>

        <div style={s.googleWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            size="large"
            width="100%"
            text={tab === "login" ? "signin_with" : "signup_with"}
          />
        </div>

        <div style={s.divider}>
          <div style={s.divLine} /><span style={s.divText}>OR</span><div style={s.divLine} />
        </div>

        <button style={s.demoBtn} onClick={() => navigate("/dashboard")}>
          ⚡&nbsp;Continue as Demo User
        </button>

        <p style={s.switchLine}>
          {tab === "login" ? "No account? " : "Have an account? "}
          <span style={s.switchLink} onClick={() => setTab(tab === "login" ? "signup" : "login")}>
            {tab === "login" ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#05080f",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    color: "#e8eaed",
    position: "relative",
    overflow: "hidden",
    padding: "80px 20px 40px",
  },
  blobGreen: {
    position: "fixed", width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(0,230,118,0.09) 0%, transparent 70%)",
    top: "-100px", left: "-150px", pointerEvents: "none",
  },
  blobBlue: {
    position: "fixed", width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(0,188,212,0.06) 0%, transparent 70%)",
    bottom: "-100px", right: "-100px", pointerEvents: "none",
  },
  nav: {
    position: "fixed", top: 0, left: 0, right: 0,
    padding: "20px 36px", zIndex: 10,
  },
  logoBtn: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  logoText: { fontSize: "0.95rem", fontWeight: "700", color: "#fff" },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    position: "relative",
    zIndex: 2,
  },

  tabGroup: {
    display: "flex", gap: "4px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "9px", padding: "4px",
    marginBottom: "24px", width: "fit-content",
  },
  tabBtn: {
    padding: "7px 20px", borderRadius: "6px",
    border: "none", background: "transparent",
    color: "#9aa0ac", fontSize: "0.875rem", fontWeight: "600",
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  tabActive: { background: "rgba(0,230,118,0.12)", color: "#00e676" },

  formTitle: { fontSize: "1.35rem", fontWeight: "800", color: "#fff", letterSpacing: "-0.4px", marginBottom: "4px" },
  formSub: { fontSize: "0.82rem", color: "#9aa0ac", marginBottom: "22px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "0.72rem", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: {
    padding: "10px 13px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "8px", color: "#e8eaed",
    fontSize: "0.875rem", fontFamily: "'Inter', sans-serif",
    outline: "none", width: "100%", boxSizing: "border-box",
  },
  forgot: { fontSize: "0.75rem", color: "#00e676", cursor: "pointer", fontWeight: "500" },
  submitBtn: {
    padding: "11px",
    background: "linear-gradient(135deg, #00e676, #00c853)",
    color: "#0d1117", border: "none", borderRadius: "8px",
    fontSize: "0.9rem", fontWeight: "800", cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 0 18px rgba(0,230,118,0.28)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginTop: "4px",
  },
  spinner: {
    width: "16px", height: "16px",
    border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0d1117",
    borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block",
  },
  divider: { display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" },
  divLine: { flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" },
  divText: { fontSize: "0.7rem", color: "#5c6370", fontWeight: "700", letterSpacing: "1px" },
  demoBtn: {
    padding: "10px", width: "100%",
    background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", color: "#e8eaed",
    fontSize: "0.85rem", fontWeight: "600",
    cursor: "pointer", fontFamily: "'Inter', sans-serif", marginBottom: "14px",
  },
  switchLine: { fontSize: "0.8rem", color: "#9aa0ac", textAlign: "center" },
  switchLink: { color: "#00e676", fontWeight: "700", cursor: "pointer" },
  errorBanner: {
    background: "rgba(255,59,48,0.12)",
    border: "1px solid rgba(255,59,48,0.35)",
    borderRadius: "8px",
    padding: "10px 13px",
    color: "#ff6b6b",
    fontSize: "0.83rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    lineHeight: "1.4",
  },
  errorIcon: { fontSize: "0.9rem", marginTop: "1px", flexShrink: 0 },
  successBanner: {
    background: "rgba(0,230,118,0.10)",
    border: "1px solid rgba(0,230,118,0.30)",
    borderRadius: "8px",
    padding: "10px 13px",
    color: "#00e676",
    fontSize: "0.83rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    marginBottom: "4px",
  },
};
