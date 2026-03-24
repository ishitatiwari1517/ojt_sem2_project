import React, { useState, useEffect } from "react";
import {
  Lightbulb, Zap, TrendingDown, Loader, RefreshCw, AlertCircle,
  ChevronRight
} from "lucide-react";
import { fetchRecommendations } from "../services/api";

const PRIORITY_STYLES = {
  high: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#f87171", badge: "#ef4444" },
  medium: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", text: "#fbbf24", badge: "#f59e0b" },
  low: { bg: "rgba(0,230,118,0.06)", border: "rgba(0,230,118,0.2)", text: "#4ade80", badge: "#00e676" },
  info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", text: "#a5b4fc", badge: "#6366f1" },
};

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecommendations();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };



  const countByPriority = (p) =>
    (data?.recommendations || []).filter((r) => r.priority === p).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><Lightbulb size={22} style={{ marginRight: 10 }} />Insights & Recommendations</h1>
          <p style={styles.subtitle}>AI-powered energy saving tips and data export tools</p>
        </div>
        <button style={styles.refreshBtn} onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      {data && (
        <div style={styles.statsRow}>
          {[
            { label: "Total Records", value: data.stats.totalRecords, color: "#00e676" },
            { label: "Total Usage (3mo)", value: `${data.stats.totalUnits} kWh`, color: "#00bcd4" },
            { label: "Avg Daily", value: `${data.stats.avgDailyUnits} kWh`, color: "#a78bfa" },
            { label: "Top Appliance", value: data.stats.topAppliance || "N/A", color: "#fbbf24" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Priority Tags */}
      {data && (
        <div style={styles.priorityRow}>
          {["high", "medium", "low", "info"].map((p) => {
            const c = PRIORITY_STYLES[p];
            const count = countByPriority(p);
            if (count === 0) return null;
            return (
              <span key={p} style={{ ...styles.priorityTag, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                {count} {p === "info" ? "info" : p} priority
              </span>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}><Lightbulb size={16} /> Energy Saving Recommendations</h2>

        {loading ? (
          <div style={styles.centerText}><Loader size={24} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : error ? (
          <div style={styles.errorCard}><AlertCircle size={16} />{error}</div>
        ) : (data?.recommendations || []).length === 0 ? (
          <p style={styles.emptyText}>No recommendations available. Add more usage data.</p>
        ) : (
          <div style={styles.recList}>
            {(data.recommendations || []).map((rec, i) => {
              const c = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.low;
              return (
                <div key={i} style={{ ...styles.recCard, background: c.bg, borderColor: c.border }}>
                  <div style={styles.recTop}>
                    <span style={styles.recIcon}>{rec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={styles.recTitle}>{rec.title}</div>
                      <span style={{ ...styles.recBadge, background: c.bg, color: c.text }}>
                        {rec.category} · {rec.priority}
                      </span>
                    </div>
                    {rec.potentialSaving !== "N/A" && (
                      <div style={styles.savingTag}>
                        <TrendingDown size={12} />
                        Save {rec.potentialSaving}
                      </div>
                    )}
                  </div>
                  <p style={styles.recDesc}>{rec.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0, display: "flex", alignItems: "center" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  refreshBtn: { display: "flex", alignItems: "center", gap: "6px", background: "#111827", border: "1px solid #1e2d40", borderRadius: "8px", color: "#9aa0ac", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" },
  statCard: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "10px", padding: "16px" },
  statLabel: { fontSize: "0.72rem", color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" },
  statValue: { fontSize: "1.2rem", fontWeight: "700" },
  priorityRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" },
  priorityTag: { padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "1rem", fontWeight: "600", color: "#e8eaed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  centerText: { textAlign: "center", padding: "60px", color: "#5c6370" },
  errorCard: { display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontSize: "0.875rem" },
  emptyText: { color: "#5c6370", textAlign: "center", padding: "30px", fontSize: "0.875rem" },
  recList: { display: "flex", flexDirection: "column", gap: "12px" },
  recCard: { border: "1px solid", borderRadius: "12px", padding: "16px 18px" },
  recTop: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" },
  recIcon: { fontSize: "1.4rem", flexShrink: 0, lineHeight: 1 },
  recTitle: { fontSize: "0.9rem", fontWeight: "600", color: "#e8eaed", marginBottom: "4px" },
  recBadge: { fontSize: "0.7rem", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.3px" },
  recDesc: { color: "#9aa0ac", fontSize: "0.84rem", lineHeight: "1.55", margin: 0 },
  savingTag: { display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "6px", padding: "4px 8px", color: "#4ade80", fontSize: "0.75rem", fontWeight: "600", flexShrink: 0 },

};
