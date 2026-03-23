import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, CheckCircle, AlertCircle, Zap, Loader, RefreshCw } from "lucide-react";
import { fetchAlerts, resolveAlert } from "../services/api";

const SEVERITY_COLORS = {
  low: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#4ade80", dot: "#22c55e" },
  medium: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", text: "#fbbf24", dot: "#f59e0b" },
  high: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", text: "#fb923c", dot: "#f97316" },
  critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#f87171", dot: "#ef4444" },
};

const SEVERITY_ICONS = { low: Zap, medium: AlertCircle, high: AlertTriangle, critical: AlertTriangle };

export default function Alerts() {
  const [data, setData] = useState({ activeAlerts: [], savedAlerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolving, setResolving] = useState(null);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAlerts();
      setData(res.data.data || { activeAlerts: [], savedAlerts: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await resolveAlert(id);
      setData((prev) => ({
        ...prev,
        savedAlerts: prev.savedAlerts.filter((a) => a._id !== id),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Resolve failed");
    } finally {
      setResolving(null);
    }
  };

  const totalCount = (data.activeAlerts?.length || 0) + (data.savedAlerts?.length || 0);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><Bell size={22} style={{ marginRight: 10 }} />Alerts & Notifications</h1>
          <p style={styles.subtitle}>
            {totalCount === 0 ? "All clear — no active alerts." : `${totalCount} alert(s) requiring attention`}
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={loadAlerts}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <div style={styles.errorCard}>{error}</div>}

      {loading ? (
        <div style={styles.centerText}><Loader size={24} style={{ animation: "spin 1s linear infinite" }} /></div>
      ) : (
        <>
          {/* Dynamic engine alerts */}
          {data.activeAlerts?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>⚡ Live Alerts</h2>
              <div style={styles.alertGrid}>
                {data.activeAlerts.map((alert, i) => {
                  const sev = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;
                  const Icon = SEVERITY_ICONS[alert.severity] || AlertCircle;
                  return (
                    <div key={i} style={{ ...styles.alertCard, background: sev.bg, borderColor: sev.border }}>
                      <div style={styles.alertTop}>
                        <div style={{ ...styles.sevDot, background: sev.dot }} />
                        <Icon size={16} color={sev.text} />
                        <span style={{ ...styles.sevBadge, color: sev.text }}>
                          {(alert.severity || "MEDIUM").toUpperCase()}
                        </span>
                        {alert.applianceName && (
                          <span style={styles.applianceTag}>{alert.applianceName}</span>
                        )}
                      </div>
                      <p style={styles.alertMsg}>{alert.message}</p>
                      {alert.value != null && (
                        <p style={styles.alertMeta}>
                          Actual: <strong>{alert.value} kWh</strong>
                          {alert.threshold && <> · Threshold: <strong>{alert.threshold} kWh</strong></>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Saved persisted alerts */}
          {data.savedAlerts?.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📋 Saved Alerts</h2>
              <div style={styles.alertGrid}>
                {data.savedAlerts.map((alert) => {
                  const sev = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;
                  const Icon = SEVERITY_ICONS[alert.severity] || AlertCircle;
                  return (
                    <div key={alert._id} style={{ ...styles.alertCard, background: sev.bg, borderColor: sev.border }}>
                      <div style={styles.alertTop}>
                        <div style={{ ...styles.sevDot, background: sev.dot }} />
                        <Icon size={16} color={sev.text} />
                        <span style={{ ...styles.sevBadge, color: sev.text }}>
                          {(alert.severity || "MEDIUM").toUpperCase()}
                        </span>
                        {alert.applianceName && (
                          <span style={styles.applianceTag}>{alert.applianceName}</span>
                        )}
                        <button
                          style={styles.resolveBtn}
                          onClick={() => handleResolve(alert._id)}
                          disabled={resolving === alert._id}
                        >
                          {resolving === alert._id ? (
                            <Loader size={12} />
                          ) : (
                            <><CheckCircle size={12} /> Resolve</>
                          )}
                        </button>
                      </div>
                      <p style={styles.alertMsg}>{alert.message}</p>
                      <p style={styles.alertMeta}>
                        {new Date(alert.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {totalCount === 0 && (
            <div style={styles.emptyState}>
              <CheckCircle size={48} color="#00e676" style={{ opacity: 0.6 }} />
              <h3 style={{ color: "#e8eaed", marginTop: "16px" }}>All clear!</h3>
              <p style={{ color: "#5c6370", fontSize: "0.9rem" }}>
                No active alerts. Your electricity usage looks normal.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0, display: "flex", alignItems: "center" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  refreshBtn: { display: "flex", alignItems: "center", gap: "6px", background: "#111827", border: "1px solid #1e2d40", borderRadius: "8px", color: "#9aa0ac", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" },
  errorCard: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#f87171", padding: "12px 16px", marginBottom: "20px", fontSize: "0.875rem" },
  centerText: { textAlign: "center", padding: "80px", color: "#5c6370" },
  section: { marginBottom: "28px" },
  sectionTitle: { fontSize: "0.9rem", fontWeight: "600", color: "#9aa0ac", marginBottom: "12px", letterSpacing: "0.3px" },
  alertGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  alertCard: { border: "1px solid", borderRadius: "12px", padding: "16px 18px" },
  alertTop: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" },
  sevDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  sevBadge: { fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.5px" },
  applianceTag: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "2px 8px", fontSize: "0.75rem", color: "#9aa0ac" },
  resolveBtn: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "6px", color: "#00e676", padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" },
  alertMsg: { color: "#e8eaed", fontSize: "0.875rem", margin: 0, lineHeight: "1.5" },
  alertMeta: { color: "#5c6370", fontSize: "0.75rem", marginTop: "6px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" },
};
