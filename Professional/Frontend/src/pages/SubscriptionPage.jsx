import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaCreditCard,
  FaLock,
  FaLockOpen,
  FaRegCalendarAlt,
  FaShieldAlt,
  FaStethoscope,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { purchaseSubscriptionPlan } from "../utils/authApi";
import { trackAnalyticsEvent } from "../utils/settings";
import MEDICAL_PLANS from "../data/medicalPlans";

const plans = MEDICAL_PLANS;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const onlyDigits = (value = "") => String(value).replace(/\D/g, "");
const formatCardNumber = (value = "") =>
  onlyDigits(value)
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value = "") => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function SubscriptionPage() {
  const token = localStorage.getItem("kanthastToken");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastUser") || "null");
    } catch {
      return null;
    }
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("details"); // details | otp | processing | success
  const [paymentStep, setPaymentStep] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [receiptTime, setReceiptTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpNotice, setOtpNotice] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [paymentForm, setPaymentForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingEmail: user?.email || "",
    otp: "",
  });

  const hasSubscription = Boolean(user?.subscriptionPurchased);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const maskCard = (cardNumber = "") => {
    const digits = onlyDigits(cardNumber);
    if (digits.length < 4) return "XXXX";
    return digits.slice(-4);
  };

  const resetCheckout = () => {
    setCheckoutPlan(null);
    setCheckoutStep("details");
    setPaymentStep("");
    setPaymentId("");
    setReceiptTime("");
    setSubmitting(false);
    setGeneratedOtp("");
    setOtpNotice("");
    setFormErrors({});
    setPaymentForm({
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
      billingEmail: user?.email || "",
      otp: "",
    });
  };

  const validateCardForm = () => {
    const errors = {};
    if (!paymentForm.cardName.trim()) errors.cardName = "Cardholder name is required";
    if (onlyDigits(paymentForm.cardNumber).length !== 16) errors.cardNumber = "Enter a valid 16-digit card number";
    if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) errors.expiry = "Use MM/YY format";
    if (!/^\d{3}$/.test(paymentForm.cvv)) errors.cvv = "Enter a valid 3-digit CVV";
    if (!/\S+@\S+\.\S+/.test(paymentForm.billingEmail)) errors.billingEmail = "Enter a valid email";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCheckout = (plan) => {
    setError("");
    setMessage("");
    setCheckoutPlan(plan);
    setCheckoutStep("details");
    setOtpNotice("");
    setFormErrors({});
  };

  const onContinueToOtp = async () => {
    if (!validateCardForm()) return;

    setSubmitting(true);
    setPaymentStep("Encrypting card details...");
    await wait(600);
    setPaymentStep("Connecting to issuer bank...");
    await wait(700);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setSubmitting(false);
    setCheckoutStep("otp");
    setPaymentStep("");
    setOtpNotice(`OTP sent to ${paymentForm.billingEmail}. Demo OTP: ${otp}`);
  };

  const onAuthorizePayment = async () => {
    if (paymentForm.otp.trim() !== generatedOtp) {
      setFormErrors({ otp: "Invalid OTP. Please retry." });
      return;
    }

    if (!token || !checkoutPlan) return;

    setSubmitting(true);
    setFormErrors({});
    setCheckoutStep("processing");

    try {
      setPaymentStep("Verifying 3D Secure authentication...");
      await wait(850);
      setPaymentStep("Capturing payment with issuing bank...");
      await wait(1100);
      setPaymentStep("Finalizing transaction and activating subscription...");
      await wait(900);

      const generatedPaymentId = `DUMTXN_${Date.now()}`;
      const data = await purchaseSubscriptionPlan(token, {
        planDurationYears: checkoutPlan.durationYears,
        dummyPaymentStatus: "success",
        dummyPaymentId: generatedPaymentId,
      });
      trackAnalyticsEvent("subscription_purchased", {
        planDurationYears: checkoutPlan.durationYears,
        paymentId: generatedPaymentId,
      });

      const mergedUser = {
        ...(user || {}),
        ...(data.user || {}),
        subscriptionPurchased: true,
      };
      localStorage.setItem("kanthastUser", JSON.stringify(mergedUser));
      setUser(mergedUser);
      setPaymentId(generatedPaymentId);
      setReceiptTime(new Date().toLocaleString("en-IN"));
      setCheckoutStep("success");
      setMessage("Payment completed and subscription activated.");
      setError("");
    } catch (err) {
      setCheckoutStep("details");
      setError(err.message || "Unable to complete payment");
    } finally {
      setSubmitting(false);
      setPaymentStep("");
    }
  };

  useEffect(() => {
    if (checkoutStep !== "success") return;
    const timer = setTimeout(() => resetCheckout(), 4000);
    return () => clearTimeout(timer);
  }, [checkoutStep]);

  const subscriptionSummary = useMemo(() => {
    if (!hasSubscription) return "No active subscription";
    return `Purchased on ${formatDate(user?.subscriptionPurchasedOn)} | Valid till ${formatDate(
      user?.subscriptionValidTill
    )}`;
  }, [hasSubscription, user]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_5%,_#cffafe,_#eff6ff_35%,_#f8fafc_90%)] px-4 md:px-8 py-10">
      <div className="page-frame">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-card border border-line bg-surface p-6 md:p-8 shadow-e4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="kx-eyebrow">Subscription</p>
              <h1 className="text-3xl md:text-4xl font-black text-ink mt-2">
                Unlock USMLE / Medicine Content
              </h1>
              <p className="text-ink-muted mt-2">Get full access to every animated lesson, quiz, and progress tool.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-800 font-semibold">
              <FaStethoscope />
              USMLE / Medicine
            </div>
          </div>

          <div className="mt-6 rounded-control border border-line bg-surface-sunken px-4 py-3 text-ink-muted font-medium flex items-center gap-2">
            <FaRegCalendarAlt />
            {subscriptionSummary}
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <motion.article
                key={plan.id}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`relative rounded-card border p-6 pt-8 ${
                  plan.highlight
                    ? "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-50"
                    : "border-line bg-surface"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-5 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md tracking-wide">
                    Recommended
                  </span>
                )}
                <p className="text-sm uppercase tracking-[0.14em] text-ink-subtle">{plan.title}</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{plan.durationLabel}</h2>
                <p className="mt-4 text-4xl font-black text-ink">{plan.priceLabel}</p>
                <p className="mt-3 text-sm text-ink-muted">{plan.desc}</p>

                <button
                  type="button"
                  onClick={() => openCheckout(plan)}
                  disabled={hasSubscription}
                  className={`btn-primary mt-6 w-full ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : ""
                  }`}
                >
                  {hasSubscription ? "Already Active" : "Proceed to Secure Checkout"}
                </button>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 rounded-card border border-line bg-surface-sunken px-4 py-4">
            <p className="text-ink font-medium flex items-center gap-2">
              <FaLockOpen />
              Purchase unlocks all locked videos and images.
            </p>
            <p className="text-ink-muted text-sm mt-1">Need help before purchasing? Ask the chatbot.</p>
            <Link to="/chatbot" className="inline-block mt-3 text-blue-700 font-semibold hover:text-blue-800">
              Ask the Assistant
            </Link>
          </div>

          {message && <p className="mt-5 text-emerald-700 font-medium">{message}</p>}
          {error && <p className="mt-5 text-red-600 font-medium">{error}</p>}
        </motion.div>
      </div>

      <AnimatePresence>
        {checkoutPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 grid place-items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              className="w-full max-w-xl rounded-card border border-line bg-surface p-6 shadow-e5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-blue-700 font-semibold">
                    Secure Checkout
                  </p>
                  <h2 className="text-2xl font-black text-ink mt-1">{checkoutPlan.durationLabel}</h2>
                  <p className="text-ink-muted mt-1">
                    {checkoutPlan.title} | {checkoutPlan.priceLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetCheckout}
                  disabled={submitting}
                  className="rounded-lg border border-line px-3 py-1.5 text-ink-muted hover:bg-surface-sunken disabled:opacity-60"
                >
                  Close
                </button>
              </div>

              {(() => {
                const stepIndex = { details: 0, otp: 1, processing: 2, success: 3 }[checkoutStep] ?? 0;
                const stepLabels = ["Card Details", "Verify OTP", "Processing", "Complete"];
                return (
                  <div className="mt-4 flex items-center gap-1">
                    {stepLabels.map((label, i) => (
                      <div key={label} className="flex items-center gap-1 flex-1">
                        <div className="flex flex-col items-center gap-1 flex-1">
                          <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-blue-500" : "bg-line"}`} />
                          <span className={`text-micro font-medium ${i <= stepIndex ? "text-blue-700" : "text-ink-subtle"}`}>{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-3 rounded-control border border-line bg-surface-sunken px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-ink-muted flex items-center gap-2">
                  <FaShieldAlt className="text-blue-700" /> TLS encrypted payment form
                </span>
                <span className="font-semibold text-ink">USD {checkoutPlan.amountUsd}.00</span>
              </div>

              {checkoutStep === "details" && (
                <div className="mt-5 space-y-3">
                  <Input
                    label="Cardholder Name"
                    value={paymentForm.cardName}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, cardName: v }))}
                    placeholder="Name on card"
                    error={formErrors.cardName}
                  />
                  <Input
                    label="Card Number"
                    value={paymentForm.cardNumber}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, cardNumber: formatCardNumber(v) }))}
                    placeholder="1234 5678 9012 3456"
                    error={formErrors.cardNumber}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Expiry"
                      value={paymentForm.expiry}
                      onChange={(v) => setPaymentForm((p) => ({ ...p, expiry: formatExpiry(v) }))}
                      placeholder="MM/YY"
                      error={formErrors.expiry}
                    />
                    <Input
                      label="CVV"
                      value={paymentForm.cvv}
                      onChange={(v) => setPaymentForm((p) => ({ ...p, cvv: onlyDigits(v).slice(0, 3) }))}
                      placeholder="123"
                      error={formErrors.cvv}
                    />
                  </div>
                  <Input
                    label="Billing Email"
                    value={paymentForm.billingEmail}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, billingEmail: v }))}
                    placeholder="you@example.com"
                    error={formErrors.billingEmail}
                  />

                  {paymentStep && (
                    <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      {paymentStep}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={onContinueToOtp}
                    disabled={submitting}
                    className="btn-primary w-full mt-1"
                  >
                    {submitting ? "Please wait..." : "Pay Securely"}
                  </button>
                </div>
              )}

              {checkoutStep === "otp" && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {otpNotice}
                  </div>
                  <Input
                    label="One-Time Password (OTP)"
                    value={paymentForm.otp}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, otp: onlyDigits(v).slice(0, 6) }))}
                    placeholder="Enter 6-digit OTP"
                    error={formErrors.otp}
                    autoFocus
                  />
                  <p className="text-xs text-ink-subtle">
                    Card ending {maskCard(paymentForm.cardNumber)} | Merchant: Kanthast Edtech
                  </p>
                  <button
                    type="button"
                    onClick={onAuthorizePayment}
                    disabled={submitting}
                    className="btn w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <FaLock />
                    {submitting ? "Authorizing..." : "Authorize Payment"}
                  </button>
                </div>
              )}

              {checkoutStep === "processing" && (
                <div className="mt-5">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                    <p className="text-blue-800 font-medium">{paymentStep || "Processing payment..."}</p>
                    <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: "12%" }}
                        animate={{ width: "88%" }}
                        transition={{ duration: 2.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-emerald-700 font-semibold flex items-center gap-2">
                      <FaCheckCircle /> Payment Successful
                    </p>
                    <p className="text-sm text-ink-muted mt-2">Transaction ID: {paymentId}</p>
                    <p className="text-sm text-ink-muted">Timestamp: {receiptTime}</p>
                    <p className="text-sm text-ink-muted">
                      Amount: USD {checkoutPlan.amountUsd}.00 | Plan: {checkoutPlan.durationLabel}
                    </p>
                    <p className="text-sm text-ink-muted mt-2">
                      Subscription valid till: {formatDate(user?.subscriptionValidTill)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCheckout}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-ink-subtle flex items-center gap-2">
                <FaCreditCard />
                Demo gateway simulation only. No real charge is made.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

