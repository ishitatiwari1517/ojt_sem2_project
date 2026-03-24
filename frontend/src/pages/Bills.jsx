import React, { useState, useEffect } from "react";
import { Receipt, Calculator, Clock, Trash2, Loader, Crown, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { fetchBills, calculateBill, fetchTariffs, deleteBill } from "../services/api";
import SubscriptionModal from "../components/SubscriptionModal";
import PaymentModal from "../components/PaymentModal";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedBill, setExpandedBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPremium = user.subscription === "premium";

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    tariffSlabId: "",
  });

  useEffect(() => {
    loadData();
  }, [isPremium]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tariffRes = await fetchTariffs();
      const loadedTariffs = tariffRes.data.data || [];
      setTariffs(loadedTariffs);

      if (user?.state) {
        const matchingTariff = loadedTariffs.find(t => t.state === user.state || t.name.includes(user.state));
        if (matchingTariff && !form.tariffSlabId) {
          setForm(prev => ({ ...prev, tariffSlabId: matchingTariff._id }));
        }
      }

      if (isPremium) {
        const billsRes = await fetchBills();
        setBills(billsRes.data.data || []);
      }
    } catch (err) {
      if (err.response?.data?.upgradeRequired) {
        setShowModal(false); // premium wall handled via UI
      } else {
        setError(err.response?.data?.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!isPremium) { setShowModal(true); return; }
    setCalcLoading(true);
    setError(null);
    try {
      const res = await calculateBill(form);
      setBills((prev) => [res.data.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || "Calculation failed");
    } finally {
      setCalcLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBill(id);
      setBills((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><Receipt size={22} style={{ marginRight: 10 }} />Bills & Tariffs</h1>
          <p style={styles.subtitle}>Calculate and track your electricity bills using slab-based tariffs</p>
        </div>
        {!isPremium && (
          <button style={styles.premiumBadge} onClick={() => setShowModal(true)}>
            <Crown size={14} /> Upgrade to Premium
          </button>
        )}
      </div>

      {/* Bill Calculator */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}><Calculator size={16} /> Calculate Bill</h2>
        {!isPremium && (
          <div style={styles.premiumWall}>
            <Crown size={20} color="#fbbf24" />
            <span>Bill calculation is a <strong>Premium</strong> feature.</span>
            <button style={styles.upgradeBtn} onClick={() => setShowModal(true)}>Upgrade Now</button>
          </div>
        )}
        <form onSubmit={handleCalculate} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Start Date</label>
              <input type="date" style={styles.input} value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>End Date</label>
              <input type="date" style={styles.input} value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tariff Plan</label>
              <select style={styles.input} value={form.tariffSlabId}
                onChange={(e) => setForm({ ...form, tariffSlabId: e.target.value })}>
                <option value="">Default Tariff</option>
                {tariffs.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.calcBtn} disabled={calcLoading}>
            {calcLoading ? <><Loader size={14} /> Calculating...</> : <><Calculator size={14} /> Calculate Bill</>}
          </button>
        </form>
      </div>

      {/* Bill History */}
      {isPremium && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}><Clock size={16} /> Bill History</h2>
          {loading ? (
            <div style={styles.centerText}><Loader size={20} style={{ animation: "spin 1s linear infinite" }} /></div>
          ) : bills.length === 0 ? (
            <p style={styles.emptyText}>No bills calculated yet. Use the form above to get started.</p>
          ) : (
            <div style={styles.billList}>
              {bills.map((bill) => (
                <div key={bill._id} style={styles.billCard}>
                  <div style={styles.billHeader}>
                    <div>
                      <span style={styles.billMonth}>{months[bill.month]} {bill.year}</span>
                      <span style={styles.billTariff}>{bill.tariffName}</span>
                    </div>
                    <div style={styles.billRight}>
                      <div style={styles.billAmount}>₹{bill.grandTotal?.toFixed(2)}</div>
                      <div style={styles.billUnits}>{bill.totalUnits?.toFixed(1)} kWh</div>
                      <button
                        style={styles.payNowBtn}
                        onClick={() => {
                          setPaymentBill({ _id: bill._id, amount: bill.grandTotal, units: bill.totalUnits, month: `${months[bill.month]} ${bill.year}` });
                          setShowPayment(true);
                        }}
                      >
                        <CreditCard size={13} /> Pay Now
                      </button>
                      <button style={styles.iconBtn} onClick={() => setExpandedBill(expandedBill === bill._id ? null : bill._id)}>
                        {expandedBill === bill._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button style={styles.iconBtn} onClick={() => handleDelete(bill._id)}>
                        <Trash2 size={16} color="#f87171" />
                      </button>
                    </div>
                  </div>

                  {expandedBill === bill._id && (
                    <div style={styles.slabTable}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                        <thead>
                          <tr>
                            {["Slab Range", "Units Used", "Rate/Unit", "Cost"].map((h) => (
                              <th key={h} style={styles.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bill.slabBreakdown?.map((slab, i) => (
                            <tr key={i}>
                              <td style={styles.td}>{slab.minUnits} – {slab.maxUnits ?? "∞"}</td>
                              <td style={styles.td}>{slab.unitsConsumed} kWh</td>
                              <td style={styles.td}>₹{slab.ratePerUnit}/unit</td>
                              <td style={styles.td}>₹{slab.slabCost?.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: "1px solid #1e2d40" }}>
                            <td style={{ ...styles.td, fontWeight: 700 }} colSpan={3}>Fixed Charges</td>
                            <td style={{ ...styles.td, fontWeight: 700 }}>₹{bill.fixedCharges?.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ ...styles.td, fontWeight: 700, color: "#00e676" }} colSpan={3}>GRAND TOTAL</td>
                            <td style={{ ...styles.td, fontWeight: 700, color: "#00e676" }}>₹{bill.grandTotal?.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpgradeSuccess={(u) => { window.location.reload(); }}
      />
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        bill={paymentBill}
        onSuccess={(paymentId) => {
          console.log("Payment successful:", paymentId);
        }}
      />
    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0, display: "flex", alignItems: "center" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  premiumBadge: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(90deg, #fbbf24,#f59e0b)", color: "#0d1117", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "1rem", fontWeight: "600", color: "#e8eaed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  premiumWall: { background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", color: "#e8eaed", fontSize: "0.875rem", marginBottom: "16px" },
  upgradeBtn: { marginLeft: "auto", background: "linear-gradient(90deg,#fbbf24,#f59e0b)", border: "none", borderRadius: "6px", padding: "6px 12px", color: "#0d1117", fontWeight: "700", cursor: "pointer", fontSize: "0.8rem" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.8rem", color: "#9aa0ac", fontWeight: "500" },
  input: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: "8px", padding: "10px 12px", color: "#e8eaed", fontSize: "0.875rem", outline: "none", colorScheme: "dark" },
  error: { color: "#f87171", fontSize: "0.85rem" },
  calcBtn: { alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg,#00e676,#00bcd4)", border: "none", borderRadius: "8px", padding: "10px 20px", color: "#0d1117", fontWeight: "700", cursor: "pointer", fontSize: "0.875rem" },
  centerText: { textAlign: "center", padding: "40px", color: "#5c6370" },
  emptyText: { color: "#5c6370", fontSize: "0.875rem", textAlign: "center", padding: "30px" },
  billList: { display: "flex", flexDirection: "column", gap: "10px" },
  billCard: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: "10px", overflow: "hidden" },
  billHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" },
  billMonth: { fontSize: "0.95rem", fontWeight: "600", color: "#e8eaed", display: "block" },
  billTariff: { fontSize: "0.75rem", color: "#5c6370" },
  billRight: { display: "flex", alignItems: "center", gap: "12px" },
  billAmount: { fontSize: "1.1rem", fontWeight: "700", color: "#00e676" },
  billUnits: { fontSize: "0.8rem", color: "#9aa0ac" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#9aa0ac", display: "flex", alignItems: "center", padding: "4px" },
  payNowBtn: { display: "flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg,#00e676,#00bcd4)", color: "#0d1117", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" },
  slabTable: { borderTop: "1px solid #1e2d40", padding: "14px 18px" },
  th: { textAlign: "left", color: "#5c6370", fontWeight: "600", padding: "6px 8px", borderBottom: "1px solid #1e2d40", fontSize: "0.75rem" },
  td: { color: "#9aa0ac", padding: "6px 8px" },
};
