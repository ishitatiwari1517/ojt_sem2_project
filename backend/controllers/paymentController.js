const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("YOUR_KEY")) {
    throw new Error("Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// POST /api/payment/create-order
// Creates a Razorpay order for a bill amount
const createOrder = asyncHandler(async (req, res) => {
  const { amount, billId, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("Invalid amount. Must be greater than 0.");
  }

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay takes paise (1 INR = 100 paise)
    currency: "INR",
    receipt: `bill_${billId || Date.now()}`,
    notes: {
      description: description || "Electricity bill payment",
      billId: billId || "",
      userId: req.user?._id?.toString() || "",
    },
  });

  res.json({
    success: true,
    message: "Payment order created",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// POST /api/payment/verify
// Verifies Razorpay payment signature after successful payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing payment verification fields.");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification failed. Invalid signature.");
  }

  res.json({
    success: true,
    message: "Payment verified successfully",
    data: { paymentId: razorpay_payment_id, orderId: razorpay_order_id },
  });
});

// GET /api/payment/config
// Returns the Razorpay key ID to the frontend (safe — never expose secret)
const getConfig = asyncHandler(async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const configured = !!(keyId && !keyId.includes("YOUR_KEY"));
  res.json({
    success: true,
    data: { keyId: configured ? keyId : null, configured },
  });
});

module.exports = { createOrder, verifyPayment, getConfig };
