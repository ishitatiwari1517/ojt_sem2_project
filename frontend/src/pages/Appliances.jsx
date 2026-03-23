import React, { useEffect, useState, useCallback } from "react";
import { Zap, Plus, X } from "lucide-react";
import { fetchUsage, deleteUsage } from "../services/api";
import DataTable from "../components/DataTable";
import { PieChart } from "../components/ChartComponent";
import { fetchApplianceAnalysis } from "../services/api";

const CATEGORIES = ["cooling", "heating", "lighting", "entertainment", "kitchen", "other"];

const CATEGORY_COLORS = {
  cooling: "badge-blue",
  heating: "badge-red",
  lighting: "badge-orange",
  entertainment: "badge-purple",
  kitchen: "badge-green",
  other: "badge-blue",
};

export default function Appliances() {
  const [records, setRecords] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([fetchUsage({ limit: 200 }), fetchApplianceAnalysis()]);
      setRecords(uRes.data.data || []);
      setAnalysis(aRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await deleteUsage(id);
    load();
  };

  const filtered = filter
    ? records.filter((r) => r.applianceName?.toLowerCase().includes(filter.toLowerCase()))
    : records;

  const columns = [
    { key: "applianceName", label: "Appliance", render: (v) => <strong>{v}</strong> },
    {
      key: "category",
      label: "Category",
      render: (v) => <span className={`badge ${CATEGORY_COLORS[v] || "badge-blue"}`}>{v}</span>,
    },
    {
      key: "units",
      label: "Units (kWh)",
      render: (v) => <span className="badge badge-green">{Number(v).toFixed(2)}</span>,
    },
    {
      key: "totalCost",
      label: "Cost (₹)",
      render: (v) => `₹ ${Number(v).toFixed(2)}`,
    },
    { key: "durationHours", label: "Duration (h)", render: (v) => `${v}h` },
    {
      key: "date",
      label: "Date",
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Zap size={22} color="#00e676" style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Appliances
        </h1>
        <p className="page-subtitle">Per-appliance energy consumption overview</p>
      </div>

      {/* Pie chart + summary */}
      {analysis.length > 0 && (
        <div className="grid-2" style={{ marginBottom: "24px" }}>
          <PieChart
            title="Energy Share by Appliance"
            labels={analysis.map((a) => a.applianceName)}
            values={analysis.map((a) => a.totalUnits)}
          />
          <div className="card">
            <h3 className="section-title">Consumption Summary</h3>
            {analysis.map((a, i) => {
              const total = analysis.reduce((s, r) => s + r.totalUnits, 0);
              const pct = total > 0 ? ((a.totalUnits / total) * 100).toFixed(1) : 0;
              return (
                <div key={a.applianceName} style={rowStyles.row}>
                  <div style={rowStyles.rank}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={rowStyles.name}>{a.applianceName}</div>
                    <div style={rowStyles.sub}>{a.totalUnits.toFixed(2)} kWh · ₹{a.totalCost.toFixed(0)}</div>
                    <div style={{ ...rowStyles.bar, marginTop: "6px" }}>
                      <div
                        style={{
                          ...rowStyles.barFill,
                          width: `${pct}%`,
                          background: ["#00e676", "#00bcd4", "#7c3aed", "#ff9800", "#2196f3"][i % 5],
                        }}
                      />
                    </div>
                  </div>
                  <div style={rowStyles.pct}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="section-title" style={{ margin: 0 }}>Usage Records</h3>
          <input
            type="text"
            className="form-control"
            placeholder="Filter by appliance..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: "200px" }}
          />
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}

const rowStyles = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #1e2d40",
  },
  rank: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#1e2d40",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#9aa0ac",
    flexShrink: 0,
  },
  name: { fontSize: "0.88rem", fontWeight: "600", color: "#e8eaed" },
  sub: { fontSize: "0.75rem", color: "#9aa0ac", marginTop: "2px" },
  bar: { height: "3px", background: "#1e2d40", borderRadius: "2px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px", transition: "width 0.5s" },
  pct: { fontSize: "0.78rem", color: "#9aa0ac", fontWeight: "600", minWidth: "36px", textAlign: "right" },
};
