import React, { useEffect, useState, useCallback } from "react";
import { BarChart2, TrendingUp, BrainCircuit, Bell } from "lucide-react";
import { BarChart, LineChart } from "../components/ChartComponent";
import AlertBanner from "../components/AlertBanner";
import MetricCard from "../components/MetricCard";
import { fetchApplianceAnalysis, fetchPrediction, fetchAlerts, fetchDashboard } from "../services/api";

export default function Analysis() {
  const [analysis, setAnalysis] = useState([]);
  const [trend, setTrend] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes, alRes, dRes] = await Promise.all([
        fetchApplianceAnalysis(),
        fetchPrediction(90),
        fetchAlerts(),
        fetchDashboard(),
      ]);
      setAnalysis(aRes.data.data || []);
      setPrediction(pRes.data.data || null);
      // API now returns { activeAlerts: [], savedAlerts: [] } — flatten both into one list
      const alertData = alRes.data.data;
      const flatAlerts = Array.isArray(alertData)
        ? alertData
        : [...(alertData?.activeAlerts || []), ...(alertData?.savedAlerts || [])];
      setAlerts(flatAlerts);
      setTrend(dRes.data.data?.monthlyTrend || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confColor = {
    high: "#00e676",
    medium: "#ff9800",
    low: "#ef5350",
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <BarChart2 size={22} color="#00e676" style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Analysis
        </h1>
        <p className="page-subtitle">Detailed insights, cost forecasting, and usage alerts</p>
      </div>

      {/* Forecast cards */}
      <div className="grid-3" style={{ marginBottom: "24px" }}>
        <div className="card predict-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Predicted Usage
            </span>
            <BrainCircuit size={18} color="#00e676" />
          </div>
          {loading ? (
            <div className="spinner" style={{ margin: "0" }} />
          ) : (
            <>
              <div className="metric-value" style={{ color: "#00e676" }}>
                {prediction?.predictedUnits ?? "—"}
              </div>
              <div className="metric-unit">kWh next month</div>
              {prediction?.confidence && (
                <span
                  className="badge"
                  style={{
                    marginTop: "10px",
                    background: `${confColor[prediction.confidence]}18`,
                    color: confColor[prediction.confidence],
                  }}
                >
                  {prediction.confidence} confidence
                </span>
              )}
            </>
          )}
        </div>

        <div className="card predict-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Predicted Cost
            </span>
            <TrendingUp size={18} color="#00bcd4" />
          </div>
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              <div className="metric-value" style={{ color: "#00bcd4" }}>
                ₹ {prediction?.predictedCost?.toFixed(0) ?? "—"}
              </div>
              <div className="metric-unit">estimated next month</div>
              {prediction?.basedOnDays && (
                <div style={{ fontSize: "0.75rem", color: "#9aa0ac", marginTop: "8px" }}>
                  Based on {prediction.basedOnDays} days of data
                </div>
              )}
            </>
          )}
        </div>

        <div className="card predict-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#9aa0ac", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Daily Average
            </span>
            <BarChart2 size={18} color="#7c3aed" />
          </div>
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              <div className="metric-value" style={{ color: "#7c3aed" }}>
                {prediction?.avgDailyUnits ?? "—"}
              </div>
              <div className="metric-unit">kWh per day (avg)</div>
            </>
          )}
        </div>
      </div>

      {/* Bar chart - cost comparison by appliance */}
      {analysis.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <BarChart
            title="Cost Comparison by Appliance"
            labels={analysis.map((a) => a.applianceName)}
            datasets={[
              {
                label: "Total Cost (₹)",
                data: analysis.map((a) => a.totalCost),
                color: "#00bcd4",
              },
              {
                label: "Units (kWh)",
                data: analysis.map((a) => a.totalUnits),
                color: "#7c3aed",
              },
            ]}
          />
        </div>
      )}

      {/* Line chart - monthly trend */}
      {trend.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <LineChart
            title="Monthly Energy Trend"
            labels={trend.map((t) => t.month)}
            datasets={[
              {
                label: "Units (kWh)",
                data: trend.map((t) => t.totalUnits),
                color: "#00e676",
              },
              {
                label: "Cost (₹)",
                data: trend.map((t) => t.totalCost),
                color: "#ff9800",
              },
            ]}
          />
        </div>
      )}

      {/* Alerts section */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Bell size={16} color="#ff9800" />
          <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#e8eaed" }}>Usage Alerts</h3>
          {alerts.length > 0 && (
            <span className="badge badge-orange">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <AlertBanner alerts={alerts} />
      </div>
    </div>
  );
}
