import React, { useState, useEffect } from "react";
import { TrendingUp, Cpu, Loader, Crown, Calendar } from "lucide-react";
import { fetchPrediction } from "../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import SubscriptionModal from "../components/SubscriptionModal";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Predictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(90);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPremium = user.subscription === "premium";

  useEffect(() => {
    loadPrediction();
  }, [days]);

  const loadPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPrediction(days);
      setPrediction(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load prediction data");
    } finally {
      setLoading(false);
    }
  };

  const chartData = prediction
    ? {
        labels: prediction.forecastData?.map((d) => d.month) || [],
        datasets: [
          {
            label: "Historical (kWh)",
            data: prediction.forecastData?.map((d) => d.historicalUnits ?? null) || [],
            borderColor: "#00bcd4",
            backgroundColor: "rgba(0,188,212,0.08)",
            borderWidth: 2,
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Predicted (kWh)",
            data: prediction.forecastData?.map((d) => d.predictedUnits ?? null) || [],
            borderColor: "#00e676",
            backgroundColor: "rgba(0,230,118,0.08)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#9aa0ac", font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#e8eaed",
        bodyColor: "#9aa0ac",
        borderColor: "#1e2d40",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#5c6370" },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: { color: "#5c6370" },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><TrendingUp size={22} style={{ marginRight: 10 }} />Usage Predictions</h1>
          <p style={styles.subtitle}>Forecast your electricity consumption based on historical patterns</p>
        </div>
        {!isPremium && (
          <button style={styles.premiumBadge} onClick={() => setShowModal(true)}>
            <Crown size={14} /> Premium Feature
          </button>
        )}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <span style={styles.controlLabel}><Calendar size={14} /> Historical window:</span>
        {[30, 60, 90, 180].map((d) => (
          <button
            key={d}
            style={{ ...styles.dayBtn, ...(days === d ? styles.dayBtnActive : {}) }}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Next Month Forecast Card */}
      {prediction && (
        <div style={styles.forecastRow}>
          <div style={styles.forecastCard}>
            <div style={styles.forecastLabel}>Predicted Units</div>
            <div style={styles.forecastValue}>{prediction.predictedUnits?.toFixed(1) ?? "—"} kWh</div>
            <div style={styles.forecastSub}>Next month estimate</div>
          </div>
          <div style={styles.forecastCard}>
            <div style={styles.forecastLabel}>Predicted Cost</div>
            <div style={{ ...styles.forecastValue, color: "#fbbf24" }}>
              ₹{prediction.predictedCost?.toFixed(2) ?? "—"}
            </div>
            <div style={styles.forecastSub}>At ₹{prediction.costPerUnit ?? 8}/unit</div>
          </div>
          <div style={styles.forecastCard}>
            <div style={styles.forecastLabel}>Avg Daily Usage</div>
            <div style={{ ...styles.forecastValue, color: "#00bcd4" }}>
              {prediction.avgDailyUnits?.toFixed(2) ?? "—"} kWh
            </div>
            <div style={styles.forecastSub}>Based on last {days} days</div>
          </div>
          <div style={styles.forecastCard}>
            <div style={styles.forecastLabel}>Data Points</div>
            <div style={{ ...styles.forecastValue, color: "#a78bfa" }}>{prediction.totalDataPoints ?? "—"}</div>
            <div style={styles.forecastSub}>Records analysed</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}><Cpu size={16} /> Forecast Chart</h2>

        {!isPremium && (
          <div style={styles.premiumWall}>
            <Crown size={18} color="#fbbf24" />
            <span>Advanced forecast charts are a <strong>Premium</strong> feature.</span>
            <button style={styles.upgradeBtn} onClick={() => setShowModal(true)}>Upgrade</button>
          </div>
        )}

        {loading ? (
          <div style={styles.centerText}><Loader size={24} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : error ? (
          <p style={styles.errorText}>{error}</p>
        ) : chartData && chartData.labels.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p style={styles.emptyText}>
            Not enough data to generate a forecast. Add more usage records to enable predictions.
          </p>
        )}

        {prediction?.message && (
          <p style={styles.message}>{prediction.message}</p>
        )}
      </div>

      <SubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)}
        onUpgradeSuccess={() => window.location.reload()} />
    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0, display: "flex", alignItems: "center" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  premiumBadge: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg,#fbbf24,#f59e0b)", color: "#0d1117", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" },
  controls: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  controlLabel: { display: "flex", alignItems: "center", gap: "6px", color: "#9aa0ac", fontSize: "0.85rem" },
  dayBtn: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: "6px", color: "#9aa0ac", padding: "6px 12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "500" },
  dayBtnActive: { background: "rgba(0,230,118,0.1)", borderColor: "#00e676", color: "#00e676" },
  forecastRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "14px", marginBottom: "20px" },
  forecastCard: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "18px" },
  forecastLabel: { fontSize: "0.75rem", color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  forecastValue: { fontSize: "1.6rem", fontWeight: "800", color: "#00e676", lineHeight: 1 },
  forecastSub: { fontSize: "0.75rem", color: "#5c6370", marginTop: "6px" },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "24px" },
  cardTitle: { fontSize: "1rem", fontWeight: "600", color: "#e8eaed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  premiumWall: { background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", color: "#e8eaed", fontSize: "0.875rem", marginBottom: "16px" },
  upgradeBtn: { marginLeft: "auto", background: "linear-gradient(90deg,#fbbf24,#f59e0b)", border: "none", borderRadius: "6px", padding: "6px 12px", color: "#0d1117", fontWeight: "700", cursor: "pointer", fontSize: "0.8rem" },
  centerText: { textAlign: "center", padding: "60px", color: "#5c6370" },
  emptyText: { color: "#5c6370", textAlign: "center", padding: "40px", fontSize: "0.875rem" },
  errorText: { color: "#f87171", textAlign: "center", padding: "20px", fontSize: "0.875rem" },
  message: { color: "#9aa0ac", fontSize: "0.8rem", marginTop: "12px", textAlign: "center", fontStyle: "italic" },
};
