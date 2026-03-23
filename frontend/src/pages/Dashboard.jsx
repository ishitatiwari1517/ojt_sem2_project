import React, { useEffect, useState, useCallback } from "react";
import {
  Zap, DollarSign, Activity, Bell, TrendingUp, TrendingDown,
  Clock, Star, Calendar, BarChart2, MapPin, Sun,
} from "lucide-react";
import MetricCard from "../components/MetricCard";
import { LineChart, DoughnutChart } from "../components/ChartComponent";
import AlertBanner from "../components/AlertBanner";
import { fetchDashboard, fetchAlerts } from "../services/api";

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ city: null, loading: true, error: false });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user?.name ? user.name.split(" ")[0] : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const load = useCallback(async () => {
    try {
      const [dRes, aRes] = await Promise.all([fetchDashboard(), fetchAlerts()]);
      setDash(dRes.data.data);
      const alertData = aRes.data.data;
      const flatAlerts = Array.isArray(alertData)
        ? alertData
        : [...(alertData?.activeAlerts || []), ...(alertData?.savedAlerts || [])];
      setAlerts(flatAlerts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocation({ city: null, loading: false, error: true }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Your Location";
          setLocation({ city, loading: false, error: false });
        } catch { setLocation({ city: null, loading: false, error: true }); }
      },
      () => setLocation({ city: null, loading: false, error: true }),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const trend = dash?.monthlyTrend || [];
  const breakdown = dash?.applianceBreakdown || [];

  // Month-over-month indicator
  const mom = dash?.momChange;
  const hasMom = mom !== null && mom !== undefined && !isNaN(mom);
  const momColor = !hasMom ? "#5c6370" : mom > 0 ? "#ef5350" : "#00e676";
  const momIcon = !hasMom ? "" : mom > 0 ? "↑" : "↓";
  const momLabel = !hasMom ? "No previous month data" : `${Math.abs(mom)}% vs last month`;

  return (
    <div className="fade-in">
      {/* Personalized Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.greeting}>
            {firstName
              ? <>{greeting}, <span style={styles.name}>{firstName}</span> 👋</>
              : <>Dashboard &nbsp;<span style={{ color: "#00e676" }}>⚡</span></>
            }
          </h1>
          <div style={styles.subRow}>
            <span style={styles.subtitle}>Real-time electricity usage overview</span>
            <span style={styles.locationBadge}>
              <MapPin size={12} color="#00bcd4" style={{ marginRight: 4 }} />
              {location.loading ? "Detecting…" : location.error || !location.city ? "Location unavailable" : location.city}
            </span>
          </div>
        </div>
        <div style={styles.dateBox}>
          <Sun size={14} color="#fbbf24" style={{ marginRight: 6 }} />
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
        </div>
      </div>

      {/* Alerts strip */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <AlertBanner alerts={alerts.slice(0, 2)} />
        </div>
      )}

      {/* ── Row 1: Core Metrics ── */}
      <div style={styles.sectionLabel}>OVERVIEW</div>
      <div className="grid-4" style={{ marginBottom: "20px" }}>
        <MetricCard title="Total Units" value={loading ? "" : (dash?.totalUnits ?? 0).toFixed(1)} unit="kWh" icon={<Zap size={18} />} accentColor="#00e676" loading={loading} />
        <MetricCard title="Total Cost" value={loading ? "" : `₹ ${(dash?.totalCost ?? 0).toFixed(0)}`} unit="" icon={<DollarSign size={18} />} accentColor="#00bcd4" loading={loading} />
        <MetricCard title="Total Records" value={loading ? "" : dash?.recordCount ?? 0} unit="entries" icon={<Activity size={18} />} accentColor="#7c3aed" loading={loading} />
        <MetricCard title="Active Alerts" value={loading ? "" : alerts.length} unit="alerts" icon={<Bell size={18} />} accentColor={alerts.length > 0 ? "#ef5350" : "#00e676"} loading={loading} />
      </div>

      {/* ── Row 2: Insights ── */}
      <div style={styles.sectionLabel}>INSIGHTS</div>
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        {/* Peak Hour */}
        <div style={styles.insightCard}>
          <div style={styles.insightTop}>
            <Clock size={18} color="#00bcd4" />
            <span style={styles.insightLabel}>Peak Usage Hour</span>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : dash?.peakHour ? (
            <>
              <div style={{ ...styles.insightValue, color: "#00bcd4" }}>{dash.peakHour}</div>
              <div style={styles.insightSub}>Highest consumption recorded</div>
            </>
          ) : (
            <div style={styles.insightSub}>Not enough data yet</div>
          )}
        </div>

        {/* Top Appliance */}
        <div style={styles.insightCard}>
          <div style={styles.insightTop}>
            <Star size={18} color="#fbbf24" />
            <span style={styles.insightLabel}>Top Appliance</span>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : dash?.topAppliance ? (
            <>
              <div style={{ ...styles.insightValue, color: "#fbbf24", fontSize: "1.1rem" }}>{dash.topAppliance}</div>
              <div style={styles.insightSub}>Highest energy consumer</div>
            </>
          ) : (
            <div style={styles.insightSub}>No appliance data</div>
          )}
        </div>

        {/* Month-over-Month */}
        <div style={styles.insightCard}>
          <div style={styles.insightTop}>
            {mom !== null && mom > 0 ? <TrendingUp size={18} color="#ef5350" /> : <TrendingDown size={18} color="#00e676" />}
            <span style={styles.insightLabel}>vs Last Month</span>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              <div style={{ ...styles.insightValue, color: momColor }}>
                {hasMom ? `${momIcon} ${Math.abs(mom)}%` : "—"}
              </div>
              <div style={styles.insightSub}>{momLabel}</div>
            </>
          )}
        </div>

        {/* Avg Daily */}
        <div style={styles.insightCard}>
          <div style={styles.insightTop}>
            <BarChart2 size={18} color="#a78bfa" />
            <span style={styles.insightLabel}>Avg Daily Usage</span>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              <div style={{ ...styles.insightValue, color: "#a78bfa" }}>{dash?.avgDailyUnits ?? 0}</div>
              <div style={styles.insightSub}>kWh per day (overall avg)</div>
            </>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: "24px" }}>
        <LineChart
          title="Monthly Usage Trend"
          labels={trend.map((t) => t.month)}
          datasets={[
            { label: "Units (kWh)", data: trend.map((t) => t.totalUnits), color: "#00e676" },
            { label: "Cost (₹)", data: trend.map((t) => t.totalCost), color: "#00bcd4" },
          ]}
        />
        {breakdown.length > 0 ? (
          <DoughnutChart
            title="Appliance Distribution"
            labels={breakdown.map((a) => a.applianceName)}
            values={breakdown.map((a) => a.totalUnits)}
          />
        ) : (
          <div className="card">
            <h3 className="section-title">Appliance Distribution</h3>
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <p>No appliance data yet</p>
              <p style={{ fontSize: "0.8rem", color: "#5c6370" }}>Add usage records to see breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Appliance table */}
      {breakdown.length > 0 && (
        <div className="card">
          <h3 className="section-title">
            <TrendingUp size={16} color="#00e676" />
            Top Appliances by Consumption
          </h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Appliance</th><th>Units (kWh)</th><th>Cost (₹)</th><th>Records</th><th>Share</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row, i) => {
                  const totalU = breakdown.reduce((a, r) => a + r.totalUnits, 0);
                  const pct = totalU > 0 ? ((row.totalUnits / totalU) * 100).toFixed(1) : 0;
                  return (
                    <tr key={row.applianceName}>
                      <td style={{ color: "#5c6370" }}>{i + 1}</td>
                      <td style={{ fontWeight: "600" }}>{row.applianceName}</td>
                      <td><span className="badge badge-green">{row.totalUnits.toFixed(1)} kWh</span></td>
                      <td><span className="badge badge-blue">₹ {row.totalCost.toFixed(2)}</span></td>
                      <td style={{ color: "#9aa0ac" }}>{row.recordCount}</td>
                      <td>
                        <div style={styles.bar}>
                          <div style={{ ...styles.barFill, width: `${pct}%`, background: i === 0 ? "#00e676" : i === 1 ? "#00bcd4" : "#7c3aed" }} />
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

const styles = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  greeting: { fontSize: "1.6rem", fontWeight: "800", color: "#e8eaed", margin: 0, letterSpacing: "-0.4px" },
  name: { background: "linear-gradient(135deg, #00e676, #00bcd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  subRow: { display: "flex", alignItems: "center", gap: "12px", marginTop: "6px", flexWrap: "wrap" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem" },
  locationBadge: { display: "inline-flex", alignItems: "center", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "20px", padding: "3px 10px", fontSize: "0.75rem", color: "#00bcd4", fontWeight: "600" },
  dateBox: { display: "flex", alignItems: "center", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "20px", padding: "6px 14px", fontSize: "0.78rem", color: "#fbbf24", fontWeight: "600" },
  sectionLabel: { fontSize: "0.65rem", fontWeight: "700", color: "#5c6370", letterSpacing: "1px", marginBottom: "10px" },
  insightCard: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "110px" },
  insightTop: { display: "flex", alignItems: "center", gap: "8px" },
  insightLabel: { fontSize: "0.72rem", fontWeight: "600", color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px" },
  insightValue: { fontSize: "1.5rem", fontWeight: "800", lineHeight: 1 },
  insightSub: { fontSize: "0.75rem", color: "#5c6370" },
  bar: { height: "4px", background: "#1e2d40", borderRadius: "2px", marginBottom: "4px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px", transition: "width 0.6s ease" },
};
