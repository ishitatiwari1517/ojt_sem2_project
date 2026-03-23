/**
 * Subscription Guard Middleware
 * Blocks access to premium-only routes for free-tier users.
 *
 * Usage (after protect middleware):
 *   router.get('/premium-route', protect, requirePremium, handler);
 */
const requirePremium = (req, res, next) => {
  if (req.user && req.user.subscription === "premium") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "This feature requires a Premium subscription.",
    upgradeRequired: true,
    plans: {
      free: { label: "Free", features: ["Basic dashboard", "Usage tracking", "CSV upload"] },
      premium: {
        label: "Premium",
        price: "₹99/month",
        features: [
          "Everything in Free",
          "Tariff slab billing engine",
          "Advanced predictions",
          "Bill history & estimator",
          "Seasonal analysis",
          "Data export",
          "Priority support",
        ],
      },
    },
  });
};

module.exports = { requirePremium };
