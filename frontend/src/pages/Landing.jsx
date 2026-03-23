import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef();

  // Smooth pulse wave animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;
    let raf;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;
      const amp = 18;
      const freq = 0.018;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,230,118,0.55)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#00e676";
      ctx.shadowBlur = 10;

      for (let x = 0; x < w; x++) {
        const y = mid + amp * Math.sin(x * freq + t) * Math.sin(x * freq * 0.4 + t * 0.5);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Fade edges
      const fl = ctx.createLinearGradient(0, 0, 80, 0);
      fl.addColorStop(0, "rgba(5,8,15,1)");
      fl.addColorStop(1, "rgba(5,8,15,0)");
      ctx.fillStyle = fl;
      ctx.fillRect(0, 0, 80, h);

      const fr = ctx.createLinearGradient(w - 80, 0, w, 0);
      fr.addColorStop(0, "rgba(5,8,15,0)");
      fr.addColorStop(1, "rgba(5,8,15,1)");
      ctx.fillStyle = fr;
      ctx.fillRect(w - 80, 0, 80, h);

      t += 0.025;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);


  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span style={s.logoText}>EnergyLens</span>
        </div>
        <button style={s.loginBtn} onClick={() => navigate("/login")}>Log in →</button>
      </nav>

      {/* HERO */}
      <main style={s.hero}>
        <h1 style={s.headline}>
          Know every<br />
          <em style={s.italic}>watt.</em>
        </h1>

        <p style={s.sub}>
          Track, analyse, and cut your home electricity bill — effortlessly.
        </p>

        <button style={s.cta} onClick={() => navigate("/login")}>
          Get Started Free &nbsp;
        </button>

        {/* Animated waveform */}
        <canvas ref={canvasRef} style={s.wave} />
      </main>
    </div>
  );
}


const s = {
  page: {
    minHeight: "100vh",
    background: "#05080f",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', sans-serif",
    color: "#e8eaed",
    position: "relative",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 40px",
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  logo: {
    display: "flex", alignItems: "center", gap: "7px",
  },
  logoText: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "-0.2px",
  },
  loginBtn: {
    background: "none",
    border: "none",
    color: "#9aa0ac",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    padding: "6px 0",
    transition: "color 0.2s",
  },

  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "100px 24px 60px",
    position: "relative",
  },
  headline: {
    fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
    fontWeight: "800",
    letterSpacing: "-3px",
    lineHeight: "1.0",
    color: "#ffffff",
    margin: "0 0 24px",
  },
  italic: {
    fontStyle: "italic",
    fontWeight: "300",
    letterSpacing: "-4px",
    color: "#00e676",
    WebkitTextStroke: "1px #00e676",
  },
  sub: {
    fontSize: "1rem",
    color: "#5c6370",
    maxWidth: "360px",
    lineHeight: "1.65",
    marginBottom: "36px",
    fontWeight: "400",
  },
  cta: {
    background: "#00e676",
    color: "#050810",
    border: "none",
    borderRadius: "9px",
    padding: "13px 30px",
    fontSize: "0.9rem",
    fontWeight: "800",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 0 28px rgba(0,230,118,0.35)",
    letterSpacing: "-0.2px",
    marginBottom: "48px",
  },
  wave: {
    position: "absolute",
    bottom: "70px",
    left: 0,
    right: 0,
    width: "100%",
    height: "60px",
    opacity: 0.9,
  },


};
