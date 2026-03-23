import React, { useState, useCallback } from "react";
import { Database, PlusCircle, Upload } from "lucide-react";
import { addUsage } from "../services/api";
import UploadForm from "../components/UploadForm";

const CATEGORIES = ["cooling", "heating", "lighting", "entertainment", "kitchen", "other"];

const initForm = {
  applianceName: "",
  date: new Date().toISOString().split("T")[0],
  units: "",
  durationHours: "",
  costPerUnit: "8",
  category: "other",
};

export default function DataInput() {
  const [tab, setTab] = useState("manual");
  const [form, setForm] = useState(initForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
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
    setLoading(true);
    try {
      await addUsage({
        ...form,
        units: parseFloat(form.units),
        durationHours: parseFloat(form.durationHours),
        costPerUnit: parseFloat(form.costPerUnit) || 8,
      });
      showToast("success", `✅ Record added for "${form.applianceName}"!`);
      setForm(initForm);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to add record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Database size={22} color="#00e676" style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Data Input
        </h1>
        <p className="page-subtitle">Add electricity usage manually or bulk-import via CSV</p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            background: toast.type === "success" ? "#00e676" : "#ef5350",
            color: "#0d1117",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "0.875rem",
            zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Tab switcher */}
      <div className="tab-group">
        <button
          className={`tab-btn ${tab === "manual" ? "active" : ""}`}
          onClick={() => setTab("manual")}
        >
          <PlusCircle size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          Manual Entry
        </button>
        <button
          className={`tab-btn ${tab === "csv" ? "active" : ""}`}
          onClick={() => setTab("csv")}
        >
          <Upload size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
          CSV Upload
        </button>
      </div>

      {tab === "manual" ? (
        <div className="card" style={{ maxWidth: "680px" }}>
          <h3 className="section-title">Add Usage Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Appliance Name *</label>
                <input
                  name="applianceName"
                  className="form-control"
                  placeholder="e.g. Air Conditioner"
                  value={form.applianceName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Units Consumed (kWh) *</label>
                <input
                  name="units"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 3.5"
                  value={form.units}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours) *</label>
                <input
                  name="durationHours"
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 4"
                  value={form.durationHours}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cost per Unit (₹)</label>
                <input
                  name="costPerUnit"
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-control"
                  placeholder="default ₹8/kWh"
                  value={form.costPerUnit}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  name="date"
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Add Record"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setForm(initForm)}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: "680px" }}>
          <h3 className="section-title">Upload CSV</h3>
          <UploadForm onSuccess={() => showToast("success", "✅ CSV imported successfully!")} />
        </div>
      )}

      {/* CSV template hint */}
      {tab === "csv" && (
        <div className="card" style={{ maxWidth: "680px", marginTop: "20px" }}>
          <h3 className="section-title">CSV Template</h3>
          <pre
            style={{
              background: "#0d1117",
              padding: "16px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "#00e676",
              overflow: "auto",
              border: "1px solid #1e2d40",
            }}
          >
{`applianceName,date,units,durationHours,costPerUnit,category
Air Conditioner,2026-03-01,4.2,6,8,cooling
Refrigerator,2026-03-01,1.5,24,8,kitchen
LED TV,2026-03-01,0.8,4,8,entertainment
Water Heater,2026-03-01,2.0,2,8,heating
LED Lights,2026-03-01,0.3,8,8,lighting`}
          </pre>
          <p style={{ fontSize: "0.78rem", color: "#9aa0ac", marginTop: "10px" }}>
            💡 <code>costPerUnit</code> and <code>category</code> are optional · date format: YYYY-MM-DD
          </p>
        </div>
      )}
    </div>
  );
}
