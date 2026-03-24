import React, { useEffect, useState, useCallback } from "react";
import { Zap, Database, PlusCircle, Upload } from "lucide-react";
import { fetchUsage, deleteUsage, addUsage, fetchApplianceAnalysis } from "../services/api";
import DataTable from "../components/DataTable";
import { PieChart } from "../components/ChartComponent";
import UploadForm from "../components/UploadForm";

const CATEGORIES = ["cooling", "heating", "lighting", "entertainment", "kitchen", "other"];
const CATEGORY_COLORS = { cooling: "badge-blue", heating: "badge-red", lighting: "badge-orange", entertainment: "badge-purple", kitchen: "badge-green", other: "badge-blue" };

const initForm = {
  applianceName: "",
  date: new Date().toISOString().split("T")[0],
  units: "",
  durationHours: "",
  costPerUnit: "8",
  category: "other",
};

export default function Appliances() {
  const [records, setRecords] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("manual");
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applianceName || !form.units || !form.durationHours) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      await addUsage({
        ...form,
        units: parseFloat(form.units),
        durationHours: parseFloat(form.durationHours),
        costPerUnit: parseFloat(form.costPerUnit) || 8,
      });
      showToast("success", `✅ Record added for "${form.applianceName}"!`);
      setForm(initForm);
      load(); // Refresh table dynamically
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to add record.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter
    ? records.filter((r) => r.applianceName?.toLowerCase().includes(filter.toLowerCase()))
    : records;

  const columns = [
    { key: "applianceName", label: "Appliance", render: (v) => <strong>{v}</strong> },
    { key: "category", label: "Category", render: (v) => <span className={`badge ${CATEGORY_COLORS[v] || "badge-blue"}`}>{v}</span> },
    { key: "units", label: "Units (kWh)", render: (v) => <span className="badge badge-green">{Number(v).toFixed(2)}</span> },
    { key: "totalCost", label: "Cost (₹)", render: (v) => `₹ ${Number(v).toFixed(2)}` },
    { key: "durationHours", label: "Duration (h)", render: (v) => `${v}h` },
    { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", }) : "—" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Zap size={22} color="#00e676" style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Appliances & Data Entry
        </h1>
        <p className="page-subtitle">Manage appliances, add manual usage, or bulk import CSV records</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={toastStyles.container(toast.type)}>
          {toast.msg}
        </div>
      )}

      {/* Data Input Section */}
      <div className="tab-group">
        <button className={`tab-btn ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>
          <PlusCircle size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          Manual Entry
        </button>
        <button className={`tab-btn ${tab === "csv" ? "active" : ""}`} onClick={() => setTab("csv")}>
          <Upload size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          CSV Upload
        </button>
      </div>

      {tab === "manual" ? (
        <div className="card" style={{ maxWidth: "100%", marginBottom: "24px" }}>
          <h3 className="section-title">Add Usage Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Appliance Name *</label>
                <input name="applianceName" className="form-control" placeholder="e.g. Air Conditioner" value={form.applianceName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Units Consumed (kWh) *</label>
                <input name="units" type="number" step="0.01" min="0" className="form-control" placeholder="e.g. 3.5" value={form.units} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours) *</label>
                <input name="durationHours" type="number" step="0.5" min="0" className="form-control" placeholder="e.g. 4" value={form.durationHours} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cost per Unit (₹)</label>
                <input name="costPerUnit" type="number" step="0.5" min="0" className="form-control" placeholder="default ₹8/kWh" value={form.costPerUnit} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input name="date" type="date" className="form-control" value={form.date} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Add Record"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setForm(initForm)}>Reset</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: "100%", marginBottom: "24px" }}>
          <h3 className="section-title">Upload CSV</h3>
          <UploadForm onSuccess={() => { showToast("success", "✅ CSV imported successfully!"); load(); }} />
        </div>
      )}

      {/* Pie chart + summary */}
      {analysis.length > 0 && (
        <div className="grid-2" style={{ marginBottom: "24px" }}>
          <PieChart title="Energy Share by Appliance" labels={analysis.map((a) => a.applianceName)} values={analysis.map((a) => a.totalUnits)} />
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
                      <div style={{ ...rowStyles.barFill, width: `${pct}%`, background: ["#00e676", "#00bcd4", "#7c3aed", "#ff9800", "#2196f3"][i % 5] }} />
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
          <input type="text" className="form-control" placeholder="Filter by appliance..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "200px" }} />
        </div>
        <DataTable columns={columns} data={filtered} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  );
}

const toastStyles = {
  container: (type) => ({
    position: "fixed", bottom: "28px", right: "28px",
    background: type === "success" ? "#00e676" : "#ef5350",
    color: "#0d1117", padding: "12px 20px", borderRadius: "10px",
    fontWeight: "600", fontSize: "0.875rem", zIndex: 999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeInUp 0.3s ease",
  }),
};

const rowStyles = {
  row: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #1e2d40" },
  rank: { width: "24px", height: "24px", borderRadius: "50%", background: "#1e2d40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", color: "#9aa0ac", flexShrink: 0 },
  name: { fontSize: "0.88rem", fontWeight: "600", color: "#e8eaed" },
  sub: { fontSize: "0.75rem", color: "#9aa0ac", marginTop: "2px" },
  bar: { height: "3px", background: "#1e2d40", borderRadius: "2px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px", transition: "width 0.5s" },
  pct: { fontSize: "0.78rem", color: "#9aa0ac", fontWeight: "600", minWidth: "36px", textAlign: "right" },
};
