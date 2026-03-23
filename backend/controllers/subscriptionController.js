const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const PLANS = {
  free: {
    name: "Free", price: 0, currency: "INR", billingPeriod: "forever",
    features: ["Basic electricity dashboard", "Manual usage tracking", "CSV import (up to 100 rows)", "Last 6 months trend chart", "Appliance breakdown (basic)", "Community support"],
  },
  premium: {
    name: "Premium", price: 99, currency: "INR", billingPeriod: "month",
    features: ["Everything in Free", "Tariff slab billing engine", "Full bill history & PDF export", "Advanced usage predictions (ML-based)", "Seasonal analysis & insights", "Budget alerts & notifications", "Unlimited CSV import", "Data export (Excel/CSV)", "Priority email support"],
  },
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("YOUR_KEY")) {
    throw new Error("Razorpay keys not configured in environment variables.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// GET /api/subscription/plans
const getPlans = asyncHandler(async (req, res) => {
  const userPlan = req.user ? req.user.subscription : null;
  res.json({ success: true, message: "Subscription plans retrieved", data: { plans: PLANS, currentPlan: userPlan } });
});

// POST /api/subscription/create-order — creates ₹99 Razorpay order
const createSubscriptionOrder = asyncHandler(async (req, res) => {
  if (req.user.subscription === "premium") {
    return res.status(400).json({ success: false, message: "You are already on Premium." });
  }

  let razorpay;
  try {
    razorpay = getRazorpay();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }

  let order;
  try {
    order = await razorpay.orders.create({
      amount: 9900,
      currency: "INR",
      receipt: `sub_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: req.user._id.toString(), plan: "premium", description: "EnergyLens Premium Subscription" },
    });
  } catch (e) {
    // Razorpay SDK errors use e.error.description
    const msg = e?.error?.description || e?.message || "Razorpay order creation failed.";
    const status = e?.statusCode || 500;
    return res.status(status).json({ success: false, message: `Payment gateway error: ${msg}` });
  }

  res.json({
    success: true,
    message: "Subscription order created",
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID },
  });
});

// POST /api/subscription/verify-and-upgrade — verify payment then upgrade user
const verifyAndUpgrade = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400); throw new Error("Missing payment verification fields.");
  }
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) {
    res.status(400); throw new Error("Payment verification failed. Invalid signature.");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { subscription: "premium", subscriptionUpdatedAt: new Date(), lastPaymentId: razorpay_payment_id },
    { new: true }
  ).select("-password");
  res.json({
    success: true,
    message: "🎉 Payment successful! You are now on Premium.",
    data: { user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription }, paymentId: razorpay_payment_id },
  });
});

// PUT /api/subscription/upgrade (admin / legacy)
const upgradeToPremium = asyncHandler(async (req, res) => {
  if (req.user.subscription === "premium") {
    return res.status(400).json({ success: false, message: "You are already on the Premium plan." });
  }
  const user = await User.findByIdAndUpdate(req.user._id, { subscription: "premium", subscriptionUpdatedAt: new Date() }, { new: true }).select("-password");
  res.json({ success: true, message: "Upgraded to Premium.", data: { user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription } } });
});

// PUT /api/subscription/downgrade
const downgradeToFree = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { subscription: "free", subscriptionUpdatedAt: new Date() }, { new: true }).select("-password");
  res.json({ success: true, message: "Plan downgraded to Free.", data: { user: { id: user._id, name: user.name, email: user.email, subscription: user.subscription } } });
});

module.exports = { getPlans, createSubscriptionOrder, verifyAndUpgrade, upgradeToPremium, downgradeToFree };
