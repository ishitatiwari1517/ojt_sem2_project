import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX, Wrench,
  Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Clock,
} from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const statusConfig = {
  active: { label: "Active", color: "#00e676", icon: ShieldCheck, bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.2)" },
  expiring_soon: { label: "Expiring Soon", color: "#f59e0b", icon: ShieldAlert, bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
  expired: { label: "Expired", color: "#ef5350", icon: ShieldX, bg: "rgba(239,83,80,0.08)", border: "rgba(239,83,80,0.3)" },
  service_due_soon: { label: "Service Due", color: "#f59e0b", icon: Wrench, bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
  service_overdue: { label: "Service Overdue", color: "#ef5350", icon: Wrench, bg: "rgba(239,83,80,0.08)", border: "rgba(239,83,80,0.3)" },
};

const token = () => localStorage.getItem("token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function Warranty() {
  const [warranties, setWarranties] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [repairForm, setRepairForm] = useState({ id: null, date: "", description: "", cost: "", servicedBy: "" });
  const [form, setForm] = useState({
    applianceName: "", brand: "", modelNumber: "", purchaseDate: "",
    warrantyEndDate: "", lastServiceDate: "", serviceIntervalMonths: "6",
    notes: "", purchasePrice: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, aRes] = await Promise.all([
        fetch(`${API}/warranty`, { headers: authHeaders() }),
        fetch(`${API}/warranty/alerts`, { headers: authHeaders() }),
      ]);
      const wData = await wRes.json();
      const aData = await aRes.json();
      setWarranties(wData.data || []);
      setAlerts(aData.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/warranty`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowForm(false);
      setForm({ applianceName: "", brand: "", modelNumber: "", purchaseDate: "", warrantyEndDate: "", lastServiceDate: "", serviceIntervalMonths: "6", notes: "", purchasePrice: "" });
      await load();
    } catch (err) { setError(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warranty record?")) return;
    await fetch(`${API}/warranty/${id}`, { method: "DELETE", headers: authHeaders() });
    await load();
  };

  const handleAddRepair = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, ...body } = repairForm;
      const res = await fetch(`${API}/warranty/${id}/repair`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setRepairForm({ id: null, date: "", description: "", cost: "", servicedBy: "" });
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const statusCounts = {
    alerts: alerts.length,
    expired: warranties.filter((w) => w.status === "expired").length,
    expiring: warranties.filter((w) => w.status === "expiring_soon").length,
    total: warranties.length,
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}><Shield size={22} color="#00e676" style={{ marginRight: 10 }} />Warranty & Service Tracker</h1>
          <p style={s.subtitle}>Track appliance warranties, service schedules, and repair history</p>
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? "Cancel" : "Add Appliance"}
        </button>
      </div>

      {/* Summary strip */}
      <div style={s.summaryRow}>
        {[
          { label: "Total Tracked", value: statusCounts.total, color: "#00e676" },
          { label: "Active Alerts", value: statusCounts.alerts, color: statusCounts.alerts > 0 ? "#ef5350" : "#5c6370" },
          { label: "Expired", value: statusCounts.expired, color: statusCounts.expired > 0 ? "#ef5350" : "#5c6370" },
          { label: "Expiring Soon", value: statusCounts.expiring, color: statusCounts.expiring > 0 ? "#f59e0b" : "#5c6370" },
        ].map((m) => (
          <div key={m.label} style={s.summaryCard}>
            <div style={{ ...s.summaryVal, color: m.color }}>{m.value}</div>
            <div style={s.summaryLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div style={s.alertsBanner}>
          <AlertTriangle size={16} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ ...s.alertItem, color: a.severity === "high" ? "#ef5350" : "#f59e0b" }}>
                {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Add Warranty Record</h3>
          {error && <div style={s.errorBanner}>{error}</div>}
          <form onSubmit={handleSubmit} style={s.formGrid}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Appliance Name *</label>
              <input style={s.input} value={form.applianceName} onChange={(e) => setForm({ ...form, applianceName: e.target.value })} placeholder="e.g. Samsung AC" required />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Brand</label>
              <input style={s.input} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Samsung" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Model Number</label>
              <input style={s.input} value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} placeholder="e.g. AR18BV" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Purchase Price (₹)</label>
              <input style={s.input} type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="35000" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Purchase Date *</label>
              <input style={s.input} type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Warranty End Date *</label>
              <input style={s.input} type="date" value={form.warrantyEndDate} onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })} required />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Last Service Date</label>
              <input style={s.input} type="date" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Service Every (months)</label>
              <input style={s.input} type="number" value={form.serviceIntervalMonths} onChange={(e) => setForm({ ...form, serviceIntervalMonths: e.target.value })} placeholder="6" />
            </div>
            <div style={{ ...s.fieldGroup, gridColumn: "1 / -1" }}>
              <label style={s.label}>Notes</label>
              <textarea style={{ ...s.input, height: "70px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" style={s.submitBtn} disabled={saving}>
                {saving ? "Saving…" : "Add Warranty Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Warranty List */}
      {loading ? (
        <div style={s.empty}>Loading warranties…</div>
      ) : warranties.length === 0 ? (
        <div style={s.emptyCard}>
          <Shield size={40} color="#1e2d40" />
          <p style={{ color: "#5c6370", marginTop: 12 }}>No warranty records yet</p>
          <p style={{ color: "#3d4a5c", fontSize: "0.85rem" }}>Click "Add Appliance" to start tracking</p>
        </div>
      ) : (
        <div style={s.list}>
          {warranties.map((w) => {
            const cfg = statusConfig[w.status] || statusConfig.active;
            const StatusIcon = cfg.icon;
            const isExp = expandedId === w._id;
            return (
              <div key={w._id} style={{ ...s.card, borderColor: cfg.border }}>
                {/* Card header */}
                <div style={s.cardHeader}>
                  <div style={s.cardLeft}>
                    <div style={{ ...s.statusBadge, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </div>
                    <div>
                      <div style={s.applianceName}>{w.applianceName}</div>
                      <div style={s.cardMeta}>
                        {w.brand && <span>{w.brand}</span>}
                        {w.modelNumber && <span> · {w.modelNumber}</span>}
                        {w.purchasePrice && <span> · ₹{w.purchasePrice.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={s.cardRight}>
                    <div style={s.dateBox}>
                      <div style={s.dateLabel}>Warranty ends</div>
                      <div style={{ ...s.dateVal, color: cfg.color }}>{fmt(w.warrantyEndDate)}</div>
                      <div style={s.dateSub}>
                        {w.daysToWarrantyEnd < 0
                          ? `Expired ${Math.abs(w.daysToWarrantyEnd)}d ago`
                          : `${w.daysToWarrantyEnd}d remaining`}
                      </div>
                    </div>
                    {w.nextServiceDate && (
                      <div style={s.dateBox}>
                        <div style={s.dateLabel}>Next service</div>
                        <div style={{ ...s.dateVal, color: w.daysToNextService < 0 ? "#ef5350" : w.daysToNextService <= 14 ? "#f59e0b" : "#9aa0ac" }}>
                          {fmt(w.nextServiceDate)}
                        </div>
                        <div style={s.dateSub}>
                          {w.daysToNextService < 0
                            ? `Overdue by ${Math.abs(w.daysToNextService)}d`
                            : `${w.daysToNextService}d away`}
                        </div>
                      </div>
                    )}
                    <div style={s.actions}>
                      <button style={s.iconBtn} onClick={() => setExpandedId(isExp ? null : w._id)} title="Show details">
                        {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button style={{ ...s.iconBtn, color: "#ef5350" }} onClick={() => handleDelete(w._id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div style={s.expanded}>
                    <div style={s.expandGrid}>
                      <div><span style={s.detailLabel}>Purchased</span><span style={s.detailVal}>{fmt(w.purchaseDate)}</span></div>
                      <div><span style={s.detailLabel}>Last Serviced</span><span style={s.detailVal}>{fmt(w.lastServiceDate)}</span></div>
                      <div><span style={s.detailLabel}>Service Interval</span><span style={s.detailVal}>{w.serviceIntervalMonths} months</span></div>
                      {w.notes && <div style={{ gridColumn: "1/-1" }}><span style={s.detailLabel}>Notes</span><span style={s.detailVal}>{w.notes}</span></div>}
                    </div>

                    {/* Repair history */}
                    {w.repairHistory?.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={s.sectionSub}>Repair History</div>
                        {w.repairHistory.map((r, i) => (
                          <div key={i} style={s.repairRow}>
                            <Clock size={12} color="#5c6370" />
                            <span style={{ color: "#9aa0ac", minWidth: 100 }}>{fmt(r.date)}</span>
                            <span style={{ flex: 1 }}>{r.description}</span>
                            {r.cost > 0 && <span style={{ color: "#00bcd4" }}>₹{r.cost}</span>}
                            {r.servicedBy && <span style={{ color: "#5c6370" }}>— {r.servicedBy}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Log repair form */}
                    {repairForm.id === w._id ? (
                      <form onSubmit={handleAddRepair} style={s.repairFormInline}>
                        <div style={s.repairFormTitle}>Log Repair / Service</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={s.fieldGroup}>
                            <label style={s.label}>Date *</label>
                            <input style={s.input} type="date" value={repairForm.date} onChange={(e) => setRepairForm({ ...repairForm, date: e.target.value })} required />
                          </div>
                          <div style={s.fieldGroup}>
                            <label style={s.label}>Cost (₹)</label>
                            <input style={s.input} type="number" value={repairForm.cost} onChange={(e) => setRepairForm({ ...repairForm, cost: e.target.value })} placeholder="500" />
                          </div>
                          <div style={s.fieldGroup}>
                            <label style={s.label}>Serviced By</label>
                            <input style={s.input} value={repairForm.servicedBy} onChange={(e) => setRepairForm({ ...repairForm, servicedBy: e.target.value })} placeholder="Technician name" />
                          </div>
                          <div style={s.fieldGroup}>
                            <label style={s.label}>Description *</label>
                            <input style={s.input} value={repairForm.description} onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })} placeholder="Annual service, filter change…" required />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                          <button type="submit" style={s.submitBtnSm} disabled={saving}>{saving ? "Saving…" : "Save Log"}</button>
                          <button type="button" style={s.cancelBtnSm} onClick={() => setRepairForm({ id: null, date: "", description: "", cost: "", servicedBy: "" })}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <button style={s.logRepairBtn} onClick={() => setRepairForm({ ...repairForm, id: w._id })}>
                        <Wrench size={14} /> Log Repair / Service
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: 800, color: "#e8eaed", margin: 0 },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: 4 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 },
  summaryCard: { background: "#111827", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px 20px", textAlign: "center" },
  summaryVal: { fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
  summaryLabel: { fontSize: "0.72rem", color: "#5c6370", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },
  alertsBanner: { display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 20 },
  alertItem: { fontSize: "0.85rem", fontWeight: 600, padding: "2px 0" },
  formCard: { background: "#111827", border: "1px solid #1e2d40", borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle: { fontSize: "1rem", fontWeight: 700, color: "#e8eaed", marginBottom: 16 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "0.72rem", fontWeight: 700, color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 8, padding: "10px 12px", color: "#e8eaed", fontSize: "0.875rem", outline: "none" },
  submitBtn: { background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "11px 24px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" },
  submitBtnSm: { background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" },
  cancelBtnSm: { background: "transparent", color: "#9aa0ac", border: "1px solid #1e2d40", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" },
  errorBanner: { background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ef5350", fontSize: "0.85rem", marginBottom: 14 },
  emptyCard: { textAlign: "center", padding: "60px 0", color: "#e8eaed" },
  empty: { color: "#5c6370", padding: 40, textAlign: "center" },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 20px", transition: "border-color 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardLeft: { display: "flex", alignItems: "flex-start", gap: 12, flex: 1 },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" },
  applianceName: { fontWeight: 700, color: "#e8eaed", fontSize: "1rem" },
  cardMeta: { fontSize: "0.78rem", color: "#5c6370", marginTop: 3 },
  cardRight: { display: "flex", alignItems: "center", gap: 20, flexShrink: 0 },
  dateBox: { textAlign: "right" },
  dateLabel: { fontSize: "0.65rem", color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px" },
  dateVal: { fontSize: "0.85rem", fontWeight: 700, marginTop: 2 },
  dateSub: { fontSize: "0.7rem", color: "#5c6370", marginTop: 1 },
  actions: { display: "flex", gap: 8 },
  iconBtn: { background: "none", border: "1px solid #1e2d40", borderRadius: 6, padding: 6, color: "#9aa0ac", cursor: "pointer", display: "flex", alignItems: "center" },
  expanded: { marginTop: 18, paddingTop: 18, borderTop: "1px solid #1e2d40" },
  expandGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  detailLabel: { display: "block", fontSize: "0.65rem", color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 },
  detailVal: { fontSize: "0.85rem", color: "#e8eaed" },
  sectionSub: { fontSize: "0.7rem", fontWeight: 700, color: "#5c6370", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 },
  repairRow: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #0d1117", fontSize: "0.82rem", color: "#e8eaed" },
  logRepairBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #1e2d40", color: "#9aa0ac", borderRadius: 7, padding: "8px 14px", fontSize: "0.8rem", cursor: "pointer", marginTop: 14, fontWeight: 600 },
  repairFormInline: { marginTop: 16, background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 10, padding: 16 },
  repairFormTitle: { fontSize: "0.8rem", fontWeight: 700, color: "#00e676", marginBottom: 12 },
};
