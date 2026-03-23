import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Zap, DollarSign, Activity, Bell, TrendingUp, TrendingDown,
  Clock, Star, BarChart2, MapPin, Sun,
} from "lucide-react";
import { LineChart, DoughnutChart } from "../components/ChartComponent";
import AlertBanner from "../components/AlertBanner";
import { fetchDashboard, fetchAlerts } from "../services/api";

/* ─── Live ECG pulse (matches landing page aesthetic) ─── */
function PulseLine() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0, raf;
    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width, h = canvas.height, mid = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,230,118,0.45)";
      ctx.lineWidth   = 1.4;
      ctx.shadowColor = "#00e676";
      ctx.shadowBlur  = 8;
      for (let x = 0; x < w; x++) {
        const spike = Math.exp(-((x - ((t * 60) % w)) ** 2) / 800) * 22;
        const base  = Math.sin(x * 0.016 + t) * 5;
        const y     = mid - base - spike;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // fade edges
      const fl = ctx.createLinearGradient(0, 0, 60, 0);
      fl.addColorStop(0, "rgba(10,14,26,1)"); fl.addColorStop(1, "rgba(10,14,26,0)");
      ctx.fillStyle = fl; ctx.fillRect(0, 0, 60, h);
      const fr = ctx.createLinearGradient(w - 60, 0, w, 0);
      fr.addColorStop(0, "rgba(10,14,26,0)"); fr.addColorStop(1, "rgba(10,14,26,1)");
      ctx.fillStyle = fr; ctx.fillRect(w - 60, 0, 60, h);
      t += 0.022; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

/* ─── SVG ring gauge ─── */
function RingGauge({ pct = 0, color = "#00e676", size = 110 }) {
  const r = 42, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2d40" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1s ease" }}
      />
      <text x="50" y="55" textAnchor="middle" fill={color} fontSize="16" fontWeight="800" fontFamily="Inter, sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

/* ─── Tiny inline bar-sparkline ─── */
function Sparkbars({ data = [], color = "#00e676" }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
      {data.slice(-12).map((v, i) => (
        <div key={i} style={{
          width: 5, borderRadius: 2,
          height: `${Math.max(4, (v / max) * 32)}px`,
          background: color,
          opacity: 0.3 + 0.7 * (i / 12),
        }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [dash, setDash]       = useState(null);
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity]       = useState(null);
  const [tick, setTick]       = useState(0); // animated counter

  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const load = useCallback(async () => {
    try {
      const [dRes, aRes] = await Promise.all([fetchDashboard(), fetchAlerts()]);
      setDash(dRes.data.data);
      const ad = aRes.data.data;
      setAlerts(Array.isArray(ad) ? ad : [...(ad?.activeAlerts || []), ...(ad?.savedAlerts || [])]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const d = await r.json();
        setCity(d.address?.city || d.address?.town || d.address?.village || null);
      } catch { /* ignore */ }
    }, () => {}, { timeout: 8000 });
  }, []);

  // Animated tick for the live kWh counter
  useEffect(() => {
    if (loading || !dash) return;
    const target = dash.totalUnits ?? 0;
    let current = 0;
    const step  = target / 60;
    const id    = setInterval(() => {
      current = Math.min(current + step, target);
      setTick(parseFloat(current.toFixed(1)));
      if (current >= target) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [loading, dash]);

  const trend     = dash?.monthlyTrend       || [];
  const breakdown = dash?.applianceBreakdown || [];
  const mom       = dash?.momChange;
  const hasMom    = mom !== null && mom !== undefined && !isNaN(mom);
  const momColor  = !hasMom ? "#5c6370" : mom > 0 ? "#ef5350" : "#00e676";

  // Gauge: usage efficiency (0 = no data, 100 = max usage recorded)
  const totalUnits = dash?.totalUnits ?? 0;
  const gaugePct   = Math.min(100, Math.round((totalUnits / Math.max(totalUnits, 500)) * 100));

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.greeting}>
            {firstName
              ? <>{greeting}, <span style={S.nameGrad}>{firstName}</span> 👋</>
              : <>Dashboard <span style={{ color: "#00e676" }}>⚡</span></>}
          </div>
          <div style={S.subRow}>
            <span style={S.subtitle}>Real-time electricity intelligence</span>
            {city && (
              <span style={S.locBadge}>
                <MapPin size={11} color="#00bcd4" style={{ marginRight: 4 }} />{city}
              </span>
            )}
          </div>
        </div>
        <div style={S.datePill}>
          <Sun size={13} color="#fbbf24" style={{ marginRight: 5 }} />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
        </div>
      </div>

      {/* ── Alerts strip ── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <AlertBanner alerts={alerts.slice(0, 2)} />
        </div>
      )}

      {/* ══════════════════════════════════════════
          BENTO GRID  — row 1
      ══════════════════════════════════════════ */}
      <div style={S.bento}>

        {/* CELL A — Big live kWh counter (2×1) */}
        <div style={{ ...S.cell, ...S.cellA }}>
          {/* ECG pulse strip */}
          <div style={S.pulseStrip}><PulseLine /></div>
          <div style={S.cellAContent}>
            <div style={S.cellLabel}>
              <Zap size={13} color="#00e676" style={{ marginRight: 5 }} />LIVE USAGE
            </div>
            <div style={S.bigNum}>
              {loading ? "—" : tick}
              <span style={S.bigUnit}>kWh</span>
            </div>
            <Sparkbars data={trend.map(t => t.totalUnits)} color="#00e676" />
            <div style={{ fontSize: "0.72rem", color: "#5c6370", marginTop: 6 }}>
              Total consumption recorded
            </div>
          </div>
        </div>

        {/* CELL B — Total Cost */}
        <div style={{ ...S.cell, ...S.cellB }}>
          <div style={S.glowOrb} />
          <div style={S.cellLabel}>
            <DollarSign size={13} color="#00bcd4" style={{ marginRight: 5 }} />TOTAL COST
          </div>
          <div style={{ ...S.medNum, color: "#00bcd4" }}>
            {loading ? "—" : `₹${(dash?.totalCost ?? 0).toFixed(0)}`}
          </div>
          <div style={S.cellSub}>billed to date</div>
        </div>

        {/* CELL C — Ring gauge */}
        <div style={{ ...S.cell, ...S.cellC }}>
          <div style={S.cellLabel}>
            <Activity size={13} color="#a78bfa" style={{ marginRight: 5 }} />USAGE LOAD
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
            {loading ? <div className="spinner" /> : <RingGauge pct={gaugePct} color="#a78bfa" />}
          </div>
          <div style={S.cellSub}>of typical range</div>
        </div>

        {/* CELL D — Records */}
        <div style={{ ...S.cell, ...S.cellD }}>
          <div style={S.cellLabel}>
            <BarChart2 size={13} color="#fbbf24" style={{ marginRight: 5 }} />RECORDS
          </div>
          <div style={{ ...S.medNum, color: "#fbbf24" }}>
            {loading ? "—" : dash?.recordCount ?? 0}
          </div>
          <div style={S.cellSub}>data entries logged</div>
        </div>

        {/* CELL E — Alerts */}
        <div style={{ ...S.cell, ...S.cellE, borderColor: alerts.length > 0 ? "rgba(239,83,80,0.3)" : "#1e2d40" }}>
          <div style={S.cellLabel}>
            <Bell size={13} color={alerts.length > 0 ? "#ef5350" : "#5c6370"} style={{ marginRight: 5 }} />
            ALERTS
          </div>
          <div style={{ ...S.medNum, color: alerts.length > 0 ? "#ef5350" : "#5c6370" }}>
            {loading ? "—" : alerts.length}
          </div>
          <div style={S.cellSub}>{alerts.length > 0 ? "action required" : "all clear"}</div>
          {alerts.length > 0 && (
            <div style={S.alertDot} />
          )}
        </div>

        {/* CELL F — MoM change */}
        <div style={{ ...S.cell, ...S.cellF }}>
          <div style={S.cellLabel}>
            {hasMom && mom > 0
              ? <TrendingUp size={13} color="#ef5350" style={{ marginRight: 5 }} />
              : <TrendingDown size={13} color="#00e676" style={{ marginRight: 5 }} />
            }
            VS LAST MONTH
          </div>
          <div style={{ ...S.medNum, color: momColor, fontSize: "1.8rem" }}>
            {loading ? "—" : hasMom ? `${mom > 0 ? "↑" : "↓"} ${Math.abs(mom)}%` : "—"}
          </div>
          <div style={S.cellSub}>{hasMom ? "month-over-month" : "no prior data"}</div>
        </div>

        {/* CELL G — Peak hour + top appliance (tall) */}
        <div style={{ ...S.cell, ...S.cellG }}>
          <div style={S.cellLabel}>
            <Clock size={13} color="#00bcd4" style={{ marginRight: 5 }} />PEAK HOUR
          </div>
          <div style={{ ...S.medNum, color: "#00bcd4", fontSize: "1.6rem", marginBottom: 4 }}>
            {loading ? "—" : dash?.peakHour ?? "N/A"}
          </div>
          <div style={S.cellSub}>highest consumption</div>

          <div style={S.divider} />

          <div style={S.cellLabel}>
            <Star size={13} color="#fbbf24" style={{ marginRight: 5 }} />TOP APPLIANCE
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>
            {loading ? "—" : dash?.topAppliance ?? "—"}
          </div>
          <div style={S.cellSub}>most energy hungry</div>
        </div>

      </div>

      {/* ── Charts row ── */}
      <div style={S.chartsRow}>
        <div style={S.chartWrap}>
          <LineChart
            title="Monthly Usage Trend"
            labels={trend.map(t => t.month)}
            datasets={[
              { label: "Units (kWh)", data: trend.map(t => t.totalUnits), color: "#00e676" },
              { label: "Cost (₹)",    data: trend.map(t => t.totalCost),   color: "#00bcd4" },
            ]}
          />
        </div>
        <div style={S.chartWrap}>
          {breakdown.length > 0
            ? <DoughnutChart
                title="Appliance Distribution"
                labels={breakdown.map(a => a.applianceName)}
                values={breakdown.map(a => a.totalUnits)}
              />
            : <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <h3 className="section-title">Appliance Distribution</h3>
                <p style={{ color: "#5c6370", fontSize: "0.85rem" }}>Add appliances to see breakdown</p>
              </div>
          }
        </div>
      </div>

      {/* ── Appliance table ── */}
      {breakdown.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <h3 className="section-title">
            <TrendingUp size={15} color="#00e676" style={{ verticalAlign: "middle", marginRight: 8 }} />
            Top Appliances by Consumption
          </h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Appliance</th><th>Units (kWh)</th><th>Cost (₹)</th><th>Records</th><th>Share</th></tr>
              </thead>
              <tbody>
                {breakdown.map((row, i) => {
                  const totalU = breakdown.reduce((a, r) => a + r.totalUnits, 0);
                  const pct    = totalU > 0 ? ((row.totalUnits / totalU) * 100).toFixed(1) : 0;
                  const clr    = ["#00e676", "#00bcd4", "#a78bfa", "#fbbf24", "#ef5350"][i % 5];
                  return (
                    <tr key={row.applianceName}>
                      <td style={{ color: "#5c6370" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{row.applianceName}</td>
                      <td><span className="badge badge-green">{row.totalUnits.toFixed(1)} kWh</span></td>
                      <td><span className="badge badge-blue">₹ {row.totalCost.toFixed(2)}</span></td>
                      <td style={{ color: "#9aa0ac" }}>{row.recordCount}</td>
                      <td>
                        <div style={{ height: 4, background: "#1e2d40", borderRadius: 2, marginBottom: 4, overflow: "hidden", width: 80 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: clr, borderRadius: 2, boxShadow: `0 0 6px ${clr}`, transition: "width 0.8s ease" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#9aa0ac" }}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const S = {
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting:  { fontSize: "1.55rem", fontWeight: 800, color: "#e8eaed", margin: 0, letterSpacing: "-0.4px" },
  nameGrad:  { background: "linear-gradient(135deg, #00e676, #00bcd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  subRow:    { display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" },
  subtitle:  { color: "#9aa0ac", fontSize: "0.85rem" },
  locBadge:  { display: "inline-flex", alignItems: "center", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: "0.73rem", color: "#00bcd4", fontWeight: 600 },
  datePill:  { display: "flex", alignItems: "center", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 20, padding: "6px 14px", fontSize: "0.78rem", color: "#fbbf24", fontWeight: 600 },

  /* Bento grid */
  bento: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gridTemplateRows:    "180px 150px",
    gap: 14,
    marginBottom: 14,
  },

  cell: {
    background: "#0a0e1a",
    border: "1px solid #1e2d40",
    borderRadius: 16,
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.3s",
  },

  /* Cell slots */
  cellA: { gridColumn: "1 / 3", gridRow: "1 / 2" },   // wide — live kWh
  cellB: { gridColumn: "3 / 4", gridRow: "1 / 2" },   // cost
  cellC: { gridColumn: "4 / 5", gridRow: "1 / 2" },   // ring gauge
  cellD: { gridColumn: "1 / 2", gridRow: "2 / 3" },   // records
  cellE: { gridColumn: "2 / 3", gridRow: "2 / 3" },   // alerts
  cellF: { gridColumn: "3 / 4", gridRow: "2 / 3" },   // mom
  cellG: { gridColumn: "4 / 5", gridRow: "1 / 3" },   // peak + top appliance (tall, 2 rows)

  cellLabel: { display: "flex", alignItems: "center", fontSize: "0.68rem", fontWeight: 700, color: "#5c6370", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 },
  cellSub:   { fontSize: "0.72rem", color: "#5c6370", marginTop: 4 },

  /* Numbers */
  bigNum:  { fontSize: "3rem", fontWeight: 900, color: "#00e676", letterSpacing: "-2px", lineHeight: 1, textShadow: "0 0 30px rgba(0,230,118,0.4)", marginBottom: 10 },
  bigUnit: { fontSize: "1rem", fontWeight: 400, color: "#5c6370", marginLeft: 6, letterSpacing: 0 },
  medNum:  { fontSize: "2rem", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 },

  /* ECG strip inside Cell A */
  pulseStrip: { position: "absolute", bottom: 0, left: 0, right: 0, height: 48, zIndex: 0 },
  cellAContent: { position: "relative", zIndex: 1 },

  /* Glow orb accent */
  glowOrb: {
    position: "absolute", bottom: -30, right: -30,
    width: 100, height: 100, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,188,212,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  /* Pulsing red dot */
  alertDot: {
    position: "absolute", top: 18, right: 18,
    width: 8, height: 8, borderRadius: "50%",
    background: "#ef5350",
    boxShadow: "0 0 8px #ef5350",
    animation: "pulse 1.5s infinite",
  },

  divider:    { height: 1, background: "#1e2d40", margin: "14px 0" },

  chartsRow:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  chartWrap:  { minHeight: 300 },
};
