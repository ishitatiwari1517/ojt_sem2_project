import React, { useState } from "react";
import { X, Zap, Crown, Check, Loader, CheckCircle, AlertCircle, Shield } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (document.getElementById("rzp-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "rzp-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

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
  "Full bill history & export",
  "Advanced usage predictions",
  "Seasonal analysis & insights",
  "Budget alerts & notifications",
  "Unlimited CSV import",
  "Data export (Excel/CSV)",
  "Priority support",
];

export default function SubscriptionModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [step, setStep] = useState("plans"); // plans | processing | success | error
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState("");

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setStep("processing");
    setError("");

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");

      // Create order on backend
      const orderRes = await fetch(`${API}/subscription/create-order`, {
        method: "POST", headers: authHeaders(),
      });

      let orderData;
      try {
        orderData = await orderRes.json();
      } catch {
        throw new Error(`Server error (${orderRes.status}). Please try again later.`);
      }

      if (!orderData.success) {
        // Give a helpful message if keys aren't configured
        if (orderData.message?.includes("not configured")) {
          throw new Error("Payment gateway not configured yet. Please contact support or try again later.");
        }
        throw new Error(orderData.message || "Failed to create payment order.");
      }

      const { orderId, amount, currency, keyId } = orderData.data;
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "EnergyLens",
        description: "Premium Subscription — ₹99/month",
        order_id: orderId,
        prefill: { name: user.name || "", email: user.email || "" },
        theme: { color: "#fbbf24" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/subscription/verify-and-upgrade`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.message);

            const updatedUser = verifyData.data.user;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setPaymentId(response.razorpay_payment_id);
            setStep("success");
            onUpgradeSuccess?.(updatedUser);
          } catch (err) {
            setError("Payment received but verification failed. Share this payment ID with support: " + response.razorpay_payment_id);
            setStep("error");
          }
        },
        modal: { ondismiss: () => setStep("plans") },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => {
        setError(`Payment failed: ${r.error.description} (Code: ${r.error.code})`);
        setStep("error");
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };


  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && step === "plans" && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <Crown size={22} color="#fbbf24" />
            <span style={s.headerTitle}>Upgrade to Premium</span>
          </div>
          {(step === "plans" || step === "success") && (
            <button style={s.closeBtn} onClick={onClose}><X size={18} color="#9aa0ac" /></button>
          )}
        </div>

        {/* STEP: Plans comparison */}
        {step === "plans" && (
          <>
            <p style={s.subtitle}>Unlock the full power of EnergyLens with advanced analytics and billing.</p>

            <div style={s.plansRow}>
              {/* Free */}
              <div style={s.planCard}>
                <div style={s.planHeader}><Zap size={18} color="#9aa0ac" /><span style={s.planName}>Free</span></div>
                <div style={s.planPrice}>₹0<span style={s.period}>/forever</span></div>
                <ul style={s.featureList}>
                  {freeFeatures.map((f) => (
                    <li key={f} style={s.featureItem}>
                      <Check size={13} color="#5c6370" style={{ flexShrink: 0 }} />
                      <span style={{ color: "#9aa0ac" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium */}
              <div style={{ ...s.planCard, ...s.planCardPremium }}>
                <div style={s.popularBadge}>MOST POPULAR</div>
                <div style={s.planHeader}><Crown size={18} color="#fbbf24" /><span style={{ ...s.planName, color: "#fbbf24" }}>Premium</span></div>
                <div style={s.planPrice}>₹99<span style={s.period}>/month</span></div>
                <ul style={s.featureList}>
                  {premiumFeatures.map((f) => (
                    <li key={f} style={s.featureItem}>
                      <Check size={13} color="#00e676" style={{ flexShrink: 0 }} />
                      <span style={{ color: "#e8eaed" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={s.secureRow}>
              <Shield size={13} color="#5c6370" />
              <span style={{ color: "#5c6370", fontSize: "0.75rem" }}>Secured by Razorpay · UPI · Cards · Net Banking · Wallets</span>
            </div>

            <button style={s.upgradeBtn} onClick={handleUpgrade}>
              <Crown size={16} /> Upgrade to Premium — ₹99/month
            </button>
            <p style={s.cancelNote}>Cancel anytime · No hidden fees · Instant activation</p>
          </>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div style={s.center}>
            <Loader size={42} color="#fbbf24" style={{ animation: "spin 1s linear infinite" }} />
            <div style={s.stepTitle}>Opening payment window…</div>
            <div style={s.stepSub}>Complete the payment in the Razorpay popup</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* STEP: Success */}
        {step === "success" && (
          <div style={s.center}>
            <CheckCircle size={52} color="#00e676" />
            <div style={{ ...s.stepTitle, color: "#00e676" }}>You're now Premium! 🎉</div>
            <div style={s.stepSub}>Payment ID: <code style={{ color: "#00bcd4" }}>{paymentId}</code></div>
            <div style={s.stepSub}>All premium features are now unlocked.</div>
            <button style={s.doneBtn} onClick={() => { onClose(); window.location.reload(); }}>
              Start Exploring →
            </button>
          </div>
        )}

        {/* STEP: Error */}
        {step === "error" && (
          <div style={s.center}>
            <AlertCircle size={52} color="#ef5350" />
            <div style={{ ...s.stepTitle, color: "#ef5350" }}>Payment Failed</div>
            <div style={s.stepSub}>{error}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button style={s.retryBtn} onClick={() => setStep("plans")}>Try Again</button>
              <button style={s.doneBtn} onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "#111827", border: "1px solid #1e2d40", borderRadius: 16, padding: 28, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#e8eaed" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", borderRadius: 6 },
  subtitle: { color: "#9aa0ac", fontSize: "0.875rem", marginBottom: 24 },
  plansRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  planCard: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 12, padding: 20, position: "relative" },
  planCardPremium: { border: "1px solid rgba(251,191,36,0.3)", background: "linear-gradient(135deg,#0d1117 0%,#1a1505 100%)" },
  popularBadge: { position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#fbbf24,#f59e0b)", color: "#0d1117", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "1px", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  planHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  planName: { fontSize: "1rem", fontWeight: 700, color: "#e8eaed" },
  planPrice: { fontSize: "1.6rem", fontWeight: 800, color: "#e8eaed", marginBottom: 16 },
  period: { fontSize: "0.8rem", fontWeight: 400, color: "#5c6370" },
  featureList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  featureItem: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.8rem", lineHeight: 1.4 },
  secureRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 14 },
  upgradeBtn: { width: "100%", padding: 14, background: "linear-gradient(90deg,#fbbf24,#f59e0b)", border: "none", borderRadius: 10, color: "#0d1117", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  cancelNote: { textAlign: "center", color: "#5c6370", fontSize: "0.75rem", marginTop: 12 },
  center: { padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" },
  stepTitle: { fontSize: "1.15rem", fontWeight: 700, color: "#e8eaed" },
  stepSub: { fontSize: "0.85rem", color: "#9aa0ac", maxWidth: 360 },
  doneBtn: { background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" },
  retryBtn: { background: "transparent", color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" },
};
