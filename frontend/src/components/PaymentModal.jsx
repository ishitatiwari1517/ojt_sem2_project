import React, { useState, useEffect } from "react";
import { CreditCard, X, CheckCircle, AlertCircle, Loader, Shield } from "lucide-react";

const API = "http://localhost:8000/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

// Dynamically load Razorpay checkout script
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
  const [step, setStep] = useState("confirm"); // confirm | processing | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("confirm");
    setErrorMsg("");
    // Check if Razorpay is configured
    fetch(`${API}/payment/config`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setConfigured(d.data?.configured || false))
      .catch(() => setConfigured(false));
  }, [isOpen]);

  const handlePay = async () => {
    setStep("processing");
    setErrorMsg("");

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      // Create order on backend
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

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "EnergyLens",
        description: `Bill Payment — ₹${bill.amount}`,
        image: "", // optional logo URL
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#00e676" },
        handler: async (response) => {
          // Verify payment on backend
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
          ondismiss: () => {
            if (step === "processing") setStep("confirm");
          },
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

        {/* Content */}
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

            {/* Razorpay config warning */}
            {configured === false && (
              <div style={s.warnBox}>
                <AlertCircle size={15} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.82rem" }}>Razorpay not configured yet</div>
                  <div style={{ color: "#9aa0ac", fontSize: "0.76rem", marginTop: 2 }}>
                    Add your <code style={{ color: "#00bcd4" }}>RAZORPAY_KEY_ID</code> and <code style={{ color: "#00bcd4" }}>RAZORPAY_KEY_SECRET</code> to <code style={{ color: "#00bcd4" }}>backend/.env</code> and restart the server.&nbsp;
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
              style={{ ...s.payBtn, opacity: configured === false ? 0.5 : 1 }}
              onClick={handlePay}
              disabled={configured === false}
            >
              Pay ₹ {bill?.amount?.toFixed(2)} Now
            </button>
          </div>
        )}

        {step === "processing" && (
          <div style={s.centerBody}>
            <Loader size={40} color="#00e676" style={{ animation: "spin 1s linear infinite" }} />
            <div style={s.stepTitle}>Opening payment window…</div>
            <div style={s.stepSub}>Complete the payment in the Razorpay popup</div>
          </div>
        )}

        {step === "success" && (
          <div style={s.centerBody}>
            <CheckCircle size={48} color="#00e676" />
            <div style={{ ...s.stepTitle, color: "#00e676" }}>Payment Successful!</div>
            <div style={s.stepSub}>Payment ID: <code style={{ color: "#00bcd4" }}>{paymentId}</code></div>
            <button style={s.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

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
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  modal: { background: "#111827", border: "1px solid #1e2d40", borderRadius: 16, width: 420, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e2d40" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: "1rem", fontWeight: 700, color: "#e8eaed" },
  closeBtn: { background: "none", border: "none", color: "#5c6370", cursor: "pointer", padding: 4, display: "flex" },
  body: { padding: "24px" },
  billBox: { background: "#0d1117", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 20px", marginBottom: 16 },
  billRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" },
  billLabel: { fontSize: "0.82rem", color: "#5c6370" },
  billVal: { fontSize: "0.88rem", color: "#e8eaed", fontWeight: 600 },
  amountBig: { fontSize: "1.6rem", fontWeight: 800, color: "#00e676" },
  warnBox: { display: "flex", gap: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, alignItems: "flex-start" },
  secureRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 16 },
  payBtn: { width: "100%", background: "linear-gradient(135deg, #00e676, #00bcd4)", color: "#0d1117", border: "none", borderRadius: 10, padding: "14px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", letterSpacing: "-0.2px" },
  centerBody: { padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" },
  stepTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#e8eaed" },
  stepSub: { fontSize: "0.85rem", color: "#9aa0ac" },
  doneBtn: { background: "#00e676", color: "#0d1117", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer" },
  retryBtn: { background: "transparent", color: "#00bcd4", border: "1px solid #00bcd4", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" },
};
