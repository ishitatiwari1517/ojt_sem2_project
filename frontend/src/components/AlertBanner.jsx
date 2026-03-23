import React from "react";
import { AlertTriangle, Info, Zap, X } from "lucide-react";

const iconMap = {
  high: <Zap size={18} color="#ef5350" />,
  medium: <AlertTriangle size={18} color="#ff9800" />,
  low: <Info size={18} color="#2196f3" />,
};

export default function AlertBanner({ alerts = [], onDismiss }) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  if (safeAlerts.length === 0) {
    return (
      <div style={styles.clear}>
        <span style={{ color: "#00e676", marginRight: "8px" }}>✓</span>
        All systems normal. No usage alerts detected.
      </div>
    );
  }

  return (
    <div>
      {safeAlerts.map((alert) => (
        <div key={alert._id} className={`alert-item alert-${alert.severity || "medium"}`}>
          <div style={{ flexShrink: 0 }}>{iconMap[alert.severity] || iconMap.medium}</div>
          <div style={{ flex: 1 }}>
            <div style={styles.msg}>{alert.message}</div>
            <div style={styles.meta}>
              {alert.type?.replace("_", " ").toUpperCase()} ·{" "}
              {new Date(alert.date || alert.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {alert.actualValue !== undefined && (
                <> · Actual: <strong>{alert.actualValue?.toFixed(1)} kWh</strong></>
              )}
              {alert.threshold !== undefined && (
                <> · Threshold: <strong>{alert.threshold?.toFixed(1)} kWh</strong></>
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert._id)}
              style={styles.dismiss}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  clear: {
    padding: "14px 16px",
    background: "rgba(0,230,118,0.05)",
    border: "1px solid rgba(0,230,118,0.2)",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#9aa0ac",
    display: "flex",
    alignItems: "center",
  },
  msg: {
    fontSize: "0.875rem",
    color: "#e8eaed",
    fontWeight: "500",
    marginBottom: "4px",
  },
  meta: {
    fontSize: "0.72rem",
    color: "#9aa0ac",
  },
  dismiss: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9aa0ac",
    padding: "4px",
    borderRadius: "4px",
    flexShrink: 0,
  },
};
