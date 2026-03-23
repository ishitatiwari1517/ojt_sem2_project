import React, { useState, useEffect } from "react";
import { Loader, Sun, CloudRain, Wind, Snowflake, AlertCircle, RefreshCw } from "lucide-react";
import { fetchSeasonalAnalysis } from "../services/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const SEASON_ICONS = { Summer: Sun, Monsoon: CloudRain, Autumn: Wind, Winter: Snowflake };
const SEASON_EMOJIS = { Summer: "☀️", Monsoon: "🌧️", Autumn: "🍂", Winter: "❄️" };

export default function SeasonalAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSeasonalAnalysis();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load seasonal data");
    } finally {
      setLoading(false);
    }
  };

  const monthlyChartData = data
    ? {
        labels: data.monthly.map((m) => m.label),
        datasets: [
          {
            label: "Units (kWh)",
            data: data.monthly.map((m) => m.totalUnits),
            backgroundColor: data.monthly.map((m) => m.color + "99"),
            borderColor: data.monthly.map((m) => m.color),
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#9aa0ac", font: { size: 12 } } },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#e8eaed",
        bodyColor: "#9aa0ac",
        borderColor: "#1e2d40",
        borderWidth: 1,
        callbacks: {
          afterLabel: (ctx) => {
            const month = data?.monthly[ctx.dataIndex];
            return month ? `Season: ${month.season}` : "";
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "#5c6370" }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#5c6370" }, grid: { color: "rgba(255,255,255,0.04)" } },
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🌍 Seasonal Analysis</h1>
          <p style={styles.subtitle}>Compare your electricity usage across different seasons of the year</p>
        </div>
        <button style={styles.refreshBtn} onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={styles.centerText}><Loader size={28} style={{ animation: "spin 1s linear infinite" }} /></div>
      ) : error ? (
        <div style={styles.errorCard}><AlertCircle size={16} />{error}</div>
      ) : (
        <>
          {/* Insight Banner */}
          {data?.insight && (
            <div style={styles.insightBanner}>
              💡 {data.insight}
            </div>
          )}

          {/* Season Cards */}
          <div style={styles.seasonGrid}>
            {(data?.seasons || []).map((s, i) => {
              const Icon = SEASON_ICONS[s.season] || Sun;
              const isTop = i === 0;
              return (
                <div key={s.season} style={{ ...styles.seasonCard, borderColor: s.color + (isTop ? "99" : "33") }}>
                  {isTop && <div style={{ ...styles.peakBadge, background: s.color }}>PEAK</div>}
                  <div style={styles.seasonTop}>
                    <span style={styles.seasonEmoji}>{SEASON_EMOJIS[s.season] || "🌡️"}</span>
                    <span style={{ ...styles.seasonName, color: s.color }}>{s.season}</span>
                  </div>
                  <div style={{ ...styles.seasonValue, color: s.color }}>{s.totalUnits.toFixed(1)}</div>
                  <div style={styles.seasonUnit}>kWh total</div>
                  <div style={styles.seasonMeta}>
                    <div>Avg/month: <strong>{s.avgMonthlyUnits} kWh</strong></div>
                    <div>Cost: <strong>₹{s.totalCost.toFixed(0)}</strong></div>
                    <div>Records: <strong>{s.recordCount}</strong></div>
                  </div>
                </div>
              );
            })}

            {(data?.seasons || []).length === 0 && (
              <p style={{ ...styles.emptyText, gridColumn: "1/-1" }}>
                No seasonal data yet. Add usage records spanning multiple months to see seasonal patterns.
              </p>
            )}
          </div>

          {/* Monthly Bar Chart */}
          {monthlyChartData && data?.monthly?.length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📅 Month-by-Month Usage (by Season)</h2>
              <p style={styles.chartNote}>
                Each bar is colour-coded by season: 🟠 Summer · 🔵 Monsoon · 🟣 Autumn · 🩵 Winter
              </p>
              <Bar data={monthlyChartData} options={chartOptions} />
            </div>
          )}

          {/* Season Comparison Table */}
          {(data?.seasons || []).length > 0 && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📊 Season Comparison Table</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Season", "Total kWh", "Avg/Month kWh", "Total Cost (₹)", "Records"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.seasons.map((s) => (
                    <tr key={s.season}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        <span style={{ color: s.color }}>{SEASON_EMOJIS[s.season]} {s.season}</span>
                      </td>
                      <td style={styles.td}>{s.totalUnits.toFixed(2)}</td>
                      <td style={styles.td}>{s.avgMonthlyUnits}</td>
                      <td style={styles.td}>₹{s.totalCost.toFixed(2)}</td>
                      <td style={styles.td}>{s.recordCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0 },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  refreshBtn: { display: "flex", alignItems: "center", gap: "6px", background: "#111827", border: "1px solid #1e2d40", borderRadius: "8px", color: "#9aa0ac", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem" },
  centerText: { textAlign: "center", padding: "80px", color: "#5c6370" },
  errorCard: { display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontSize: "0.875rem", padding: "16px", background: "rgba(239,68,68,0.08)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.2)" },
  insightBanner: { background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "10px", padding: "14px 18px", color: "#9aa0ac", fontSize: "0.875rem", marginBottom: "20px", lineHeight: "1.5" },
  seasonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "20px" },
  seasonCard: { background: "#111827", border: "1px solid", borderRadius: "14px", padding: "20px", position: "relative", overflow: "hidden" },
  peakBadge: { position: "absolute", top: "10px", right: "-16px", color: "#0d1117", fontSize: "0.6rem", fontWeight: "800", letterSpacing: "1px", padding: "2px 20px", transform: "rotate(12deg)" },
  seasonTop: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  seasonEmoji: { fontSize: "1.4rem" },
  seasonName: { fontSize: "1rem", fontWeight: "700" },
  seasonValue: { fontSize: "2rem", fontWeight: "800", lineHeight: 1, marginBottom: "4px" },
  seasonUnit: { fontSize: "0.75rem", color: "#5c6370", marginBottom: "14px" },
  seasonMeta: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.78rem", color: "#9aa0ac" },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "1rem", fontWeight: "600", color: "#e8eaed", marginBottom: "12px" },
  chartNote: { fontSize: "0.78rem", color: "#5c6370", marginBottom: "16px" },
  emptyText: { color: "#5c6370", textAlign: "center", padding: "40px", fontSize: "0.875rem" },
  th: { textAlign: "left", color: "#5c6370", fontWeight: "600", padding: "10px 12px", borderBottom: "1px solid #1e2d40", fontSize: "0.8rem" },
  td: { color: "#9aa0ac", padding: "10px 12px", borderBottom: "1px solid #0d1117", fontSize: "0.875rem" },
};
