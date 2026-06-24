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
import {
  getSchoolClassLabel,
  getSelectedSchoolClass,
  isSchoolTrack,
  schoolClassOptions,
  setSelectedSchoolClass,
} from "../utils/schoolTrack";

const plans = [
  {
    id: "usmle-1y",
    title: "USMLE / Medicine",
    durationLabel: "1 Year Plan",
    durationYears: 1,
    amountUsd: 110,
    priceLabel: "110 USD",
    highlight: false,
    desc: "Full access to all videos and images for one year. Great for a focused exam cycle.",
  },
  {
    id: "usmle-2y",
    title: "USMLE / Medicine",
    durationLabel: "2 Year Plan",
    durationYears: 2,
    amountUsd: 200,
    priceLabel: "200 USD",
    highlight: true,
    desc: "Best value — just $100/year. Save $20 vs two annual plans. Ideal for med students who want uninterrupted access through clerkships and boards.",
  },
];

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
  const schoolMode = isSchoolTrack();

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
        track: "medical",
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

  if (schoolMode) {
    return <SchoolSubscriptionPage token={token} user={user} setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_5%,_#cffafe,_#eff6ff_35%,_#f8fafc_90%)] px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.09)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Subscription</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
                Unlock USMLE / Medicine Content
              </h1>
              <p className="text-slate-600 mt-2">Secure checkout simulation for subscription purchase flow.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-cyan-800 font-semibold">
              <FaStethoscope />
              USMLE / Medicine
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-medium flex items-center gap-2">
            <FaRegCalendarAlt />
            {subscriptionSummary}
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <motion.article
                key={plan.id}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`relative rounded-2xl border p-6 pt-8 ${
                  plan.highlight
                    ? "border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-5 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md tracking-wide">
                    Recommended
                  </span>
                )}
                <p className="text-sm uppercase tracking-[0.14em] text-slate-500">{plan.title}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">{plan.durationLabel}</h2>
                <p className="mt-4 text-4xl font-black text-slate-900">{plan.priceLabel}</p>
                <p className="mt-3 text-sm text-slate-600">{plan.desc}</p>

                <button
                  type="button"
                  onClick={() => openCheckout(plan)}
                  disabled={hasSubscription}
                  className={`mt-6 w-full rounded-xl py-3 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {hasSubscription ? "Already Active" : "Proceed to Secure Checkout"}
                </button>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-slate-800 font-medium flex items-center gap-2">
              <FaLockOpen />
              Purchase unlocks all locked videos and images.
            </p>
            <p className="text-slate-600 text-sm mt-1">Need help before purchasing? Ask the chatbot.</p>
            <Link to="/chatbot" className="inline-block mt-3 text-cyan-700 font-semibold hover:text-cyan-800">
              Open Chatbot Support
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
              className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-cyan-700 font-semibold">
                    Secure Checkout
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{checkoutPlan.durationLabel}</h2>
                  <p className="text-slate-600 mt-1">
                    {checkoutPlan.title} | {checkoutPlan.priceLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetCheckout}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
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
                          <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-cyan-500" : "bg-slate-200"}`} />
                          <span className={`text-[10px] font-medium ${i <= stepIndex ? "text-cyan-700" : "text-slate-400"}`}>{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <FaShieldAlt className="text-cyan-700" /> TLS encrypted payment form
                </span>
                <span className="font-semibold text-slate-900">USD {checkoutPlan.amountUsd}.00</span>
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
                    className="w-full mt-1 rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    {submitting ? "Please wait..." : "Pay Securely"}
                  </button>
                </div>
              )}

              {checkoutStep === "otp" && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
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
                  <p className="text-xs text-slate-500">
                    Card ending {maskCard(paymentForm.cardNumber)} | Merchant: Kanthast Edtech
                  </p>
                  <button
                    type="button"
                    onClick={onAuthorizePayment}
                    disabled={submitting}
                    className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
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
                    <p className="text-sm text-slate-700 mt-2">Transaction ID: {paymentId}</p>
                    <p className="text-sm text-slate-700">Timestamp: {receiptTime}</p>
                    <p className="text-sm text-slate-700">
                      Amount: USD {checkoutPlan.amountUsd}.00 | Plan: {checkoutPlan.durationLabel}
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      Subscription valid till: {formatDate(user?.subscriptionValidTill)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetCheckout}
                    className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
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

function SchoolSubscriptionPage({ token, user, setUser }) {
  const [selectedClass, setSelectedClass] = useState(getSelectedSchoolClass());
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const classLabel = getSchoolClassLabel(selectedClass);
  const activeClass = user?.track === "school" ? user?.schoolClass : "";
  const hasClassSubscription = Boolean(
    user?.subscriptionPurchased &&
      (user?.track === "school" || user?.subscriptionPlan === "school-class-1y") &&
      activeClass
  );

  const selectClass = (value) => {
    setSelectedClass(value);
    setSelectedSchoolClass(value);
    setMessage("");
    setError("");
  };

  const purchaseSchoolPlan = async () => {
    if (!token) {
      setError("Please log in before purchasing a class plan.");
      return;
    }

    setStatus("loading");
    setError("");
    setMessage("");

    try {
      const generatedPaymentId = `SCHOOL_${selectedClass}_${Date.now()}`;
      const data = await purchaseSubscriptionPlan(token, {
        track: "school",
        schoolClass: selectedClass,
        planDurationYears: 1,
        dummyPaymentStatus: "success",
        dummyPaymentId: generatedPaymentId,
      });

      setSelectedSchoolClass(selectedClass);
      const mergedUser = {
        ...(user || {}),
        ...(data.user || {}),
        subscriptionPurchased: true,
      };
      localStorage.setItem("kanthastUser", JSON.stringify(mergedUser));
      setUser(mergedUser);
      trackAnalyticsEvent("school_subscription_purchased", {
        classLevel: selectedClass,
        amountInr: 5000,
        paymentId: generatedPaymentId,
      });
      setReceipt({
        paymentId: generatedPaymentId,
        classLabel,
        amount: "Rs 5,000",
        time: new Date().toLocaleString("en-IN"),
      });
      setMessage(`${classLabel} course activated successfully.`);
    } catch (err) {
      setError(err.message || "Unable to activate school subscription.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbff] px-4 py-10 md:px-8">
      <Helmet>
        <title>Kanthast School Subscription | Classes I-X</title>
        <meta
          name="description"
          content="Choose a class from I-X and activate Kanthast School annual access for Rs 5,000."
        />
      </Helmet>

      <div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Kanthast School plan</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">
                Choose class. Pay once. Learn all year.
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Annual access unlocks the selected class content inside Lists and Dashboard. Each student gets one
                focused class plan for clean progress tracking.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
              <p className="text-sm font-semibold text-cyan-800">Current status</p>
              <p className="mt-1 font-bold text-slate-950">
                {hasClassSubscription ? `${getSchoolClassLabel(activeClass)} active` : "No School class active"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Select class</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {schoolClassOptions.map((option) => {
                  const active = selectedClass === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectClass(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-cyan-400 bg-cyan-50 text-cyan-900 shadow-[0_10px_25px_rgba(8,145,178,0.12)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Class</span>
                      <p className="mt-1 text-lg font-black">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Annual access</p>
              <h2 className="mt-3 text-2xl font-black">{classLabel}</h2>
              <p className="mt-4 text-5xl font-black">Rs 5,000</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Unlocks all subjects and class-specific chapters for one academic year.
              </p>
              <button
                type="button"
                onClick={purchaseSchoolPlan}
                disabled={status === "loading"}
                className="mt-6 w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {status === "loading" ? "Activating..." : "Pay Rs 5,000 and Activate"}
              </button>
              <Link to="/courses" className="mt-3 block text-center text-sm font-semibold text-cyan-200 hover:text-white">
                Review all classes
              </Link>
            </aside>
          </div>

          {message && <p className="mt-5 font-semibold text-emerald-700">{message}</p>}
          {error && <p className="mt-5 font-semibold text-red-600">{error}</p>}
          {receipt && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
              <p className="font-bold text-emerald-800">Payment receipt</p>
              <p className="mt-2">Class: {receipt.classLabel}</p>
              <p>Amount: {receipt.amount}</p>
              <p>Transaction: {receipt.paymentId}</p>
              <p>Time: {receipt.time}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, error, autoFocus }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}
