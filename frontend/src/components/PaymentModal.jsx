import React, { useState, useEffect } from "react";
import { CreditCard, X, CheckCircle, AlertCircle, Loader, Shield, Phone } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PaymentModal({ isOpen, onClose, bill, onSuccess }) {
  const [step, setStep]         = useState("confirm");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [configured, setConfigured] = useState(null);
  const [phone, setPhone]       = useState("");
  const [upiId, setUpiId]       = useState("");
  const [payMethod, setPayMethod] = useState("all"); // all | upi | card

  useEffect(() => {
    if (!isOpen) return;
    setStep("confirm");
    setErrorMsg("");
    setPayMethod("all");
    setUpiId("");
    // Pre-fill phone from stored user profile
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setPhone(user.phone || "");

    fetch(`${API}/payment/config`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setConfigured(d.data?.configured || false))
      .catch(() => setConfigured(false));
  }, [isOpen]);

  const handlePay = async () => {
    setStep("processing");
    setErrorMsg("");

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const orderRes = await fetch(`${API}/payment/create-order`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          amount: bill.amount,
          billId: bill._id,
          description: `Electricity Bill — ${bill.month || "Current month"}`,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message);

      const { orderId, amount, currency, keyId } = orderData.data;
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Build method-specific display config
      let methodConfig = undefined;
      if (payMethod === "upi") {
        methodConfig = {
          display: {
            blocks: {
              upi_block: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
            },
            sequence: ["block.upi_block"],
            preferences: { show_default_blocks: false },
          },
        };
      } else if (payMethod === "card") {
        methodConfig = {
          display: {
            blocks: {
              card_block: {
                name: "Pay via Card / Net Banking",
                instruments: [{ method: "card" }, { method: "netbanking" }],
              },
            },
            sequence: ["block.card_block"],
            preferences: { show_default_blocks: false },
          },
        };
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "EnergyLens",
        description: `Bill Payment — ₹${bill.amount}`,
        image: "",
        order_id: orderId,
        prefill: {
          name:    user.name  || "",
          email:   user.email || "",
          // ⬇ contact is REQUIRED for UPI to appear in Razorpay popup
          contact: phone || user.phone || "",
          ...(payMethod === "upi" && upiId ? { vpa: upiId } : {}),
        },
        theme: { color: "#00e676" },
        ...(methodConfig ? { config: methodConfig } : {}),
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/payment/verify`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.message);
            setPaymentId(response.razorpay_payment_id);
            setStep("success");
            onSuccess && onSuccess(response.razorpay_payment_id);
          } catch (err) {
            setErrorMsg("Payment received but verification failed. Please contact support.");
            setStep("error");
          }
        },
        modal: {
          ondismiss: () => { setStep("confirm"); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setErrorMsg(`Payment failed: ${response.error.description}`);
        setStep("error");
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

  if (!isOpen) return null;

  const methods = [
    { id: "all",  label: "All Methods",        icon: "💳" },
    { id: "upi",  label: "UPI",                icon: "📲" },
    { id: "card", label: "Card / Net Banking", icon: "🏦" },
  ];

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <CreditCard size={20} color="#00e676" />
            <span style={s.headerTitle}>Pay Bill</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Confirm ─────────────────────────────────────────── */}
        {step === "confirm" && (
          <div style={s.body}>

            {/* Bill summary */}
            <div style={s.billBox}>
              <div style={s.billRow}>
                <span style={s.billLabel}>Bill Month</span>
                <span style={s.billVal}>{bill?.month || "Current Month"}</span>
              </div>
              <div style={s.billRow}>
                <span style={s.billLabel}>Units Used</span>
                <span style={s.billVal}>{bill?.units?.toFixed(1) || "—"} kWh</span>
              </div>
              <div style={{ ...s.billRow, borderTop: "1px solid #1e2d40", paddingTop: 12, marginTop: 4 }}>
                <span style={{ ...s.billLabel, fontWeight: 700, color: "#e8eaed" }}>Total Due</span>
                <span style={s.amountBig}>₹ {bill?.amount?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* Phone number — required for UPI */}
            <div style={s.fieldBox}>
              <label style={s.fieldLabel}>
                <Phone size={12} style={{ marginRight: 4 }} />
                Mobile Number
                <span style={{ color: "#ef5350", marginLeft: 2 }}>*</span>
                <span style={{ color: "#5c6370", fontWeight: 400, marginLeft: 4 }}>(required for UPI)</span>
              </label>
              <input
                style={s.fieldInput}
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {/* Payment method selector */}
            <div style={s.methodLabel}>Choose Payment Method</div>
            <div style={s.methodRow}>
              {methods.map((m) => (
                <button
                  key={m.id}
                  style={{ ...s.methodBtn, ...(payMethod === m.id ? s.methodBtnActive : {}) }}
                  onClick={() => setPayMethod(m.id)}
                >
                  <span style={{ fontSize: "1.1rem" }}>{m.icon}</span>
                  <span style={{ fontSize: "0.74rem", fontWeight: 600 }}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* UPI ID — optional, only shown when UPI selected */}
            {payMethod === "upi" && (
              <div style={s.upiBox}>
                <label style={s.upiLabel}>
                  UPI ID&nbsp;
                  <span style={{ color: "#5c6370", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  style={s.fieldInput}
                  type="text"
                  placeholder="yourname@upi  e.g. name@paytm · name@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {/* Razorpay config warning */}
            {configured === false && (
              <div style={s.warnBox}>
                <AlertCircle size={15} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.82rem" }}>Razorpay not configured yet</div>
                  <div style={{ color: "#9aa0ac", fontSize: "0.76rem", marginTop: 2 }}>
                    Add <code style={{ color: "#00bcd4" }}>RAZORPAY_KEY_ID</code> &amp; <code style={{ color: "#00bcd4" }}>RAZORPAY_KEY_SECRET</code> to <code style={{ color: "#00bcd4" }}>backend/.env</code>.&nbsp;
                    <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" style={{ color: "#00e676" }}>Get free test keys →</a>
                  </div>
                </div>
              </div>
            )}

            <div style={s.secureRow}>
              <Shield size={13} color="#5c6370" />
              <span style={{ color: "#5c6370", fontSize: "0.75rem" }}>Secured by Razorpay · UPI · Cards · Net Banking · Wallets</span>
            </div>

            <button
              style={{ ...s.payBtn, opacity: (configured === false || !phone) ? 0.5 : 1 }}
              onClick={handlePay}
              disabled={configured === false || !phone}
            >
              {payMethod === "upi" ? "📲 " : payMethod === "card" ? "💳 " : ""}
              Pay ₹ {bill?.amount?.toFixed(2)} Now
            </button>

            {!phone && (
              <div style={{ textAlign: "center", fontSize: "0.73rem", color: "#f59e0b", marginTop: 8 }}>
                ⚠ Enter your mobile number to enable UPI &amp; all payment options
              </div>
            )}
          </div>
        )}

        {/* ── Processing ──────────────────────────────────────── */}
        {step === "processing" && (
          <div style={s.centerBody}>
            <Loader size={40} color="#00e676" style={{ animation: "spin 1s linear infinite" }} />
            <div style={s.stepTitle}>Opening payment window…</div>
            <div style={s.stepSub}>Complete the payment in the Razorpay popup</div>
          </div>
        )}

        {/* ── Success ─────────────────────────────────────────── */}
        {step === "success" && (
          <div style={s.centerBody}>
            <CheckCircle size={48} color="#00e676" />
            <div style={{ ...s.stepTitle, color: "#00e676" }}>Payment Successful!</div>
            <div style={s.stepSub}>Payment ID: <code style={{ color: "#00bcd4" }}>{paymentId}</code></div>
            <button style={s.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {step === "error" && (
          <div style={s.centerBody}>
            <AlertCircle size={48} color="#ef5350" />
            <div style={{ ...s.stepTitle, color: "#ef5350" }}>Payment Failed</div>
            <div style={s.stepSub}>{errorMsg}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={s.retryBtn} onClick={() => setStep("confirm")}>Try Again</button>
              <button style={s.doneBtn} onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

const s = {
  overlay:         { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  modal:           { background: "#111827", border: "1px solid #1e2d40", borderRadius: 16, width: 430, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e2d40" },
  headerLeft:      { display: "flex", alignItems: "center", gap: 10 },
  headerTitle:     { fontSize: "1rem", fontWeight: 700, color: "#e8eaed" },
  closeBtn:        { background: "none", border: "none", color: "#5c6370", cursor: "pointer", padding: 4, display: "flex" },
  body:            { padding: "20px 24px 24px" },
  billBox:         { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px 20px", marginBottom: 14 },
  billRow:         { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" },
  billLabel:       { fontSize: "0.82rem", color: "#5c6370" },
  billVal:         { fontSize: "0.88rem", color: "#e8eaed", fontWeight: 600 },
  amountBig:       { fontSize: "1.55rem", fontWeight: 800, color: "#00e676" },
  fieldBox:        { marginBottom: 14 },
  fieldLabel:      { fontSize: "0.78rem", fontWeight: 700, color: "#e8eaed", display: "flex", alignItems: "center", marginBottom: 7 },
  fieldInput:      { width: "100%", background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 8, padding: "10px 12px", color: "#e8eaed", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" },
  methodLabel:     { fontSize: "0.75rem", color: "#9aa0ac", fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" },
  methodRow:       { display: "flex", gap: 8, marginBottom: 14 },
  methodBtn:       { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 10, cursor: "pointer", color: "#9aa0ac", transition: "all 0.15s" },
  methodBtnActive: { border: "1px solid #00e676", color: "#00e676", background: "rgba(0,230,118,0.07)" },
  upiBox:          { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 10, padding: "12px 14px", marginBottom: 14 },
  upiLabel:        { fontSize: "0.78rem", fontWeight: 700, color: "#e8eaed", display: "flex", alignItems: "center", marginBottom: 7 },
  warnBox:         { display: "flex", gap: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 14, alignItems: "flex-start" },
  secureRow:       { display: "flex", alignItems: "center", gap: 6, marginBottom: 14 },
  payBtn:          { width: "100%", background: "linear-gradient(135deg, #00e676, #00bcd4)", color: "#0d1117", border: "none", borderRadius: 10, padding: "14px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", letterSpacing: "-0.2px" },
  centerBody:      { padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" },
  stepTitle:       { fontSize: "1.1rem", fontWeight: 700, color: "#e8eaed" },
  stepSub:         { fontSize: "0.85rem", color: "#9aa0ac" },
  doneBtn:         { background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" },
  retryBtn:        { background: "transparent", color: "#00bcd4", border: "1px solid #00bcd4", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" },
};
