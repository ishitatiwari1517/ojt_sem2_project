import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * MetricCard - displays a KPI with icon, value, unit, and optional change indicator
 * Props: title, value, unit, icon (ReactNode), accentColor, change (number), 
 *        changeLabel, description
 */
export default function MetricCard({
  title,
  value,
  unit,
  icon,
  accentColor = "#00e676",
  change,
  changeLabel,
  description,
  loading = false,
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="card fade-in" style={styles.card}>
      {/* Top row */}
      <div style={styles.topRow}>
        <div style={styles.titleGroup}>
          <span style={styles.title}>{title}</span>
          {description && <span style={styles.description}>{description}</span>}
        </div>
        {icon && (
          <div
            style={{
              ...styles.iconWrap,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div style={styles.skeleton} />
      ) : (
        <div style={styles.valueRow}>
          <span
            className="metric-value"
            style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}40` }}
          >
            {value ?? "—"}
          </span>
          {unit && <span style={styles.unit}>{unit}</span>}
        </div>
      )}

      {/* Change indicator */}
      {change !== undefined && !loading && (
        <div
          className={`metric-change ${
            isPositive ? "positive" : isNegative ? "negative" : "neutral"
          }`}
          style={{ marginTop: "10px" }}
        >
          {isPositive ? (
            <TrendingUp size={12} />
          ) : isNegative ? (
            <TrendingDown size={12} />
          ) : (
            <Minus size={12} />
          )}
          {Math.abs(change).toFixed(1)}% {changeLabel || "vs last month"}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    minHeight: "130px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  title: {
    fontSize: "0.78rem",
    fontWeight: "600",
    color: "#9aa0ac",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  description: {
    fontSize: "0.7rem",
    color: "#5c6370",
  },
  iconWrap: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  valueRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    flexWrap: "wrap",
  },
  unit: {
    fontSize: "1rem",
    color: "#9aa0ac",
    fontWeight: "500",
    alignSelf: "flex-end",
    marginBottom: "4px",
  },
  skeleton: {
    height: "40px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #1a2235 25%, #1e293b 50%, #1a2235 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    marginTop: "4px",
  },
};
