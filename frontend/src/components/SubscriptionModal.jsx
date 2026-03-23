import React, { useState } from "react";
import { X, Zap, Crown, Check, Loader } from "lucide-react";
import { upgradePlan } from "../services/api";

export default function SubscriptionModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await upgradePlan();
      const updatedUser = res.data.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUpgradeSuccess?.(updatedUser);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Upgrade failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    "Basic electricity dashboard",
    "Manual usage tracking",
    "CSV import (up to 100 rows)",
    "6-month trend charts",
    "Appliance breakdown",
  ];

  const premiumFeatures = [
    "Everything in Free",
    "Tariff slab billing engine",
    "Full bill history",
    "Advanced usage predictions",
    "Seasonal analysis & insights",
    "Budget alerts",
    "Unlimited CSV import",
    "Data export (Excel/CSV)",
    "Priority support",
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Crown size={22} color="#fbbf24" />
            <span style={styles.headerTitle}>Upgrade to Premium</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} color="#9aa0ac" />
          </button>
        </div>

        <p style={styles.subtitle}>
          Unlock the full power of EnergyLens with advanced analytics and billing.
        </p>

        {/* Plan Comparison */}
        <div style={styles.plansRow}>
          {/* Free Plan */}
          <div style={styles.planCard}>
            <div style={styles.planHeader}>
              <Zap size={18} color="#9aa0ac" />
              <span style={styles.planName}>Free</span>
            </div>
            <div style={styles.planPrice}>₹0<span style={styles.period}>/forever</span></div>
            <ul style={styles.featureList}>
              {freeFeatures.map((f) => (
                <li key={f} style={styles.featureItem}>
                  <Check size={14} color="#5c6370" style={{ flexShrink: 0 }} />
                  <span style={{ color: "#9aa0ac" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div style={{ ...styles.planCard, ...styles.planCardPremium }}>
            <div style={styles.popularBadge}>MOST POPULAR</div>
            <div style={styles.planHeader}>
              <Crown size={18} color="#fbbf24" />
              <span style={{ ...styles.planName, color: "#fbbf24" }}>Premium</span>
            </div>
            <div style={styles.planPrice}>
              ₹99<span style={styles.period}>/month</span>
            </div>
            <ul style={styles.featureList}>
              {premiumFeatures.map((f) => (
                <li key={f} style={styles.featureItem}>
                  <Check size={14} color="#00e676" style={{ flexShrink: 0 }} />
                  <span style={{ color: "#e8eaed" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Error */}
        {error && <div style={styles.errorMsg}>{error}</div>}

        {/* CTA */}
        <button style={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
          {loading ? (
            <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Upgrading...</>
          ) : (
            <><Crown size={16} /> Upgrade to Premium — ₹99/month</>
          )}
        </button>
        <p style={styles.cancelNote}>Cancel anytime · No hidden fees</p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#111827",
    border: "1px solid #1e2d40",
    borderRadius: "16px",
    padding: "28px",
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerTitle: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#e8eaed",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    borderRadius: "6px",
  },
  subtitle: {
    color: "#9aa0ac",
    fontSize: "0.875rem",
    marginBottom: "24px",
  },
  plansRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
  },
  planCard: {
    background: "#0d1117",
    border: "1px solid #1e2d40",
    borderRadius: "12px",
    padding: "20px",
    position: "relative",
  },
  planCardPremium: {
    border: "1px solid rgba(251,191,36,0.3)",
    background: "linear-gradient(135deg, #0d1117 0%, #1a1505 100%)",
  },
  popularBadge: {
    position: "absolute",
    top: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
    color: "#0d1117",
    fontSize: "0.6rem",
    fontWeight: "800",
    letterSpacing: "1px",
    padding: "3px 10px",
    borderRadius: "20px",
  },
  planHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  planName: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#e8eaed",
  },
  planPrice: {
    fontSize: "1.6rem",
    fontWeight: "800",
    color: "#e8eaed",
    marginBottom: "16px",
  },
  period: {
    fontSize: "0.8rem",
    fontWeight: "400",
    color: "#5c6370",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "0.8rem",
    lineHeight: "1.4",
  },
  upgradeBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
    border: "none",
    borderRadius: "10px",
    color: "#0d1117",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "opacity 0.2s",
  },
  cancelNote: {
    textAlign: "center",
    color: "#5c6370",
    fontSize: "0.75rem",
    marginTop: "12px",
  },
  errorMsg: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    color: "#f87171",
    padding: "10px 14px",
    fontSize: "0.85rem",
    marginBottom: "16px",
  },
};
