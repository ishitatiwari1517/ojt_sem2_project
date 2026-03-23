const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const PLANS = {
  free: {
    name: "Free",
    price: 0,
    currency: "INR",
    billingPeriod: "forever",
    features: [
      "Basic electricity dashboard",
      "Manual usage tracking",
      "CSV import (up to 100 rows)",
      "Last 6 months trend chart",
      "Appliance breakdown (basic)",
      "Community support",
    ],
  },
  premium: {
    name: "Premium",
    price: 99,
    currency: "INR",
    billingPeriod: "month",
    features: [
      "Everything in Free",
      "Tariff slab billing engine",
      "Full bill history & PDF export",
      "Advanced usage predictions (ML-based)",
      "Seasonal analysis & insights",
      "Budget alerts & notifications",
      "Unlimited CSV import",
      "Data export (Excel/CSV)",
      "Priority email support",
    ],
  },
};

// GET /api/subscription/plans
const getPlans = asyncHandler(async (req, res) => {
  const userPlan = req.user ? req.user.subscription : null;
  res.json({
    success: true,
    message: "Subscription plans retrieved",
    data: {
      plans: PLANS,
      currentPlan: userPlan,
    },
  });
});

// PUT /api/subscription/upgrade
const upgradeToPremium = asyncHandler(async (req, res) => {
  if (req.user.subscription === "premium") {
    return res.status(400).json({
      success: false,
      message: "You are already on the Premium plan.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { subscription: "premium", subscriptionUpdatedAt: new Date() },
    { new: true }
  ).select("-password");

  res.json({
    success: true,
    message: "🎉 You have been upgraded to Premium!",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
      },
    },
  });
});

// PUT /api/subscription/downgrade
const downgradeToFree = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { subscription: "free", subscriptionUpdatedAt: new Date() },
    { new: true }
  ).select("-password");

  res.json({
    success: true,
    message: "Plan downgraded to Free.",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
      },
    },
  });
});

module.exports = { getPlans, upgradeToPremium, downgradeToFree };
