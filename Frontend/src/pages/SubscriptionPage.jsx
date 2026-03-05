import { useState } from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaLockOpen, FaStethoscope } from "react-icons/fa";
import { Link } from "react-router-dom";
import { purchaseSubscriptionPlan } from "../utils/authApi";

const plans = [
  {
    id: "usmle-1y",
    title: "USMLE / Medicine",
    durationLabel: "1 Year Plan",
    durationYears: 1,
    priceLabel: "110 USD",
    highlight: false,
  },
  {
    id: "usmle-2y",
    title: "USMLE / Medicine",
    durationLabel: "2 Year Plan",
    durationYears: 2,
    priceLabel: "200 USD",
    highlight: true,
  },
];

export default function SubscriptionPage() {
  const token = localStorage.getItem("kanthastToken");
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastUser") || "null");
    } catch {
      return null;
    }
  });

  const hasSubscription = Boolean(user?.subscriptionPurchased);
  const validTill = user?.subscriptionValidTill
    ? new Date(user.subscriptionValidTill).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
  const purchasedOn = user?.subscriptionPurchasedOn
    ? new Date(user.subscriptionPurchasedOn).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePurchase = async (plan) => {
    if (!token) return;

    setLoadingPlanId(plan.id);
    setError("");
    setMessage("");
    setPaymentStep("Validating details...");

    try {
      await wait(700);
      setPaymentStep("Authorizing dummy card payment...");
      await wait(1100);
      setPaymentStep("Payment successful. Activating subscription...");
      await wait(800);

      const dummyPaymentId = `DUMMY_${Date.now()}`;
      const data = await purchaseSubscriptionPlan(token, {
        planDurationYears: plan.durationYears,
        dummyPaymentStatus: "success",
        dummyPaymentId,
      });

      const mergedUser = {
        ...(user || {}),
        ...(data.user || {}),
        subscriptionPurchased: true,
      };
      localStorage.setItem("kanthastUser", JSON.stringify(mergedUser));
      setUser(mergedUser);
      setMessage("Dummy payment completed. Subscription activated and all videos/images are unlocked.");
    } catch (err) {
      setError(err.message || "Unable to activate subscription");
    } finally {
      setLoadingPlanId("");
      setPaymentStep("");
    }
  };

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
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
                Subscription
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
                Unlock USMLE / Medicine Content
              </h1>
              <p className="text-slate-600 mt-2">
                Choose your plan and unlock all videos and image tabs.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-cyan-800 font-semibold">
              <FaStethoscope />
              USMLE / Medicine
            </div>
          </div>

          {hasSubscription && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 font-medium flex items-center gap-2">
              <FaCheckCircle />
              Subscription active. Purchased on: {purchasedOn} | Valid till: {validTill}
            </div>
          )}

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-sm uppercase tracking-[0.14em] text-slate-500">{plan.title}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">{plan.durationLabel}</h2>
                <p className="mt-4 text-4xl font-black text-slate-900">{plan.priceLabel}</p>
                <p className="mt-3 text-sm text-slate-600">
                  Full access to all platform videos and image resources.
                </p>

                <button
                  type="button"
                  onClick={() => handlePurchase(plan)}
                  disabled={hasSubscription || loadingPlanId === plan.id}
                  className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingPlanId === plan.id ? "Activating..." : hasSubscription ? "Activated" : "Purchase Plan"}
                </button>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-slate-800 font-medium flex items-center gap-2">
              <FaLockOpen />
              Purchase unlocks all locked videos and images.
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Need help before purchasing? Ask the chatbot and it will guide you.
            </p>
            <Link to="/chatbot" className="inline-block mt-3 text-cyan-700 font-semibold hover:text-cyan-800">
              Open Chatbot Support
            </Link>
          </div>

          {message && <p className="mt-5 text-emerald-700 font-medium">{message}</p>}
          {paymentStep && <p className="mt-5 text-blue-700 font-medium">{paymentStep}</p>}
          {error && <p className="mt-5 text-red-600 font-medium">{error}</p>}
        </motion.div>
      </div>
    </div>
  );
}
