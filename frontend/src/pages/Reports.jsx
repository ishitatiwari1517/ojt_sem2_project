import React, { useState } from "react";
import { Download, Loader, Crown, FileText } from "lucide-react";
import { exportUsageCSV, exportBillsCSV } from "../services/api";

export default function Reports() {
  const [exportingUsage, setExportingUsage] = useState(false);
  const [exportingBills, setExportingBills] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPremium = user.subscription === "premium";

  const handleExportUsage = async () => {
    setExportingUsage(true);
    try {
      const res = await exportUsageCSV();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `energylens_usage_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Export failed");
    } finally {
      setExportingUsage(false);
    }
  };

  const handleExportBills = async () => {
    setExportingBills(true);
    try {
      const res = await exportBillsCSV();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `energylens_bills_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Export failed");
    } finally {
      setExportingBills(false);
    }
  };

  return (
    <div className="fade-in" style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><FileText size={22} color="#00e676" style={{ marginRight: 10 }} />Reports & Data Export</h1>
          <p style={styles.subtitle}>Download your electricity data as CSV files for offline analysis or record keeping</p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}><Download size={16} /> Export Your Data</h2>
        
        <div style={styles.exportGrid}>
          <div style={styles.exportCard}>
            <div style={styles.exportIcon}>📊</div>
            <div>
              <div style={styles.exportTitle}>Usage Records</div>
              <div style={styles.exportSub}>All appliance usage logs with cost breakdown</div>
            </div>
            <button style={styles.exportBtn} onClick={handleExportUsage} disabled={exportingUsage}>
              {exportingUsage ? <Loader size={14} /> : <><Download size={14} /> Download CSV</>}
            </button>
          </div>

          <div style={{ ...styles.exportCard, ...(isPremium ? {} : styles.exportCardLocked) }}>
            <div style={styles.exportIcon}>🧾</div>
            <div>
              <div style={styles.exportTitle}>
                Bill History
                {!isPremium && <Crown size={12} color="#fbbf24" style={{ marginLeft: 6 }} />}
              </div>
              <div style={styles.exportSub}>All calculated bills with slab breakdown</div>
            </div>
            <button
              style={isPremium ? styles.exportBtn : styles.exportBtnLocked}
              onClick={isPremium ? handleExportBills : undefined}
              disabled={!isPremium || exportingBills}
            >
              {exportingBills ? <Loader size={14} /> : isPremium ? <><Download size={14} /> Download CSV</> : "Premium Only"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#e8eaed", margin: 0, display: "flex", alignItems: "center" },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginTop: "6px" },
  card: { background: "#111827", border: "1px solid #1e2d40", borderRadius: "12px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "1rem", fontWeight: "600", color: "#e8eaed", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  exportGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  exportCard: { display: "flex", alignItems: "center", gap: "16px", background: "#0d1117", border: "1px solid #1e2d40", borderRadius: "10px", padding: "16px 20px" },
  exportCardLocked: { opacity: 0.6 },
  exportIcon: { fontSize: "1.6rem", flexShrink: 0 },
  exportTitle: { fontSize: "0.9rem", fontWeight: "600", color: "#e8eaed", display: "flex", alignItems: "center" },
  exportSub: { fontSize: "0.78rem", color: "#5c6370", marginTop: "2px" },
  exportBtn: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#00e676,#00bcd4)", border: "none", borderRadius: "8px", padding: "8px 16px", color: "#0d1117", fontWeight: "700", cursor: "pointer", fontSize: "0.8rem", flexShrink: 0 },
  exportBtnLocked: { marginLeft: "auto", background: "#1e2d40", border: "none", borderRadius: "8px", padding: "8px 16px", color: "#5c6370", fontWeight: "600", cursor: "not-allowed", fontSize: "0.8rem", flexShrink: 0 },
};
