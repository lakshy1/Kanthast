import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaLockOpen, FaRegCalendarAlt, FaStethoscope } from "react-icons/fa";
import { Link } from "react-router-dom";
import MEDICAL_PLANS from "../data/medicalPlans";

const plans = MEDICAL_PLANS;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function SubscriptionPage() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastUser") || "null");
    } catch {
      return null;
    }
  });

  const hasSubscription = Boolean(user?.subscriptionPurchased);

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
              <p className="text-ink-muted mt-2">Plans for lectures as they are released. Payments are not open yet.</p>
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
                  disabled
                  className="btn-primary mt-6 w-full cursor-not-allowed opacity-60"
                >
                  {hasSubscription ? "Already Active" : "Coming soon"}
                </button>
                {!hasSubscription && (
                  <p className="mt-2 text-center text-xs text-ink-subtle">
                    Online payments open soon. Nothing is charged today.
                  </p>
                )}
              </motion.article>
            ))}
          </div>

          <div className="mt-8 rounded-card border border-line bg-surface-sunken px-4 py-4">
            <p className="text-ink font-medium flex items-center gap-2">
              <FaLockOpen />
              Your plan will unlock every lecture and image as it is released.
            </p>
            <p className="text-ink-muted text-sm mt-1">Questions before payments open? Ask the chatbot.</p>
            <Link to="/chatbot" className="inline-block mt-3 text-blue-700 font-semibold hover:text-blue-800">
              Ask the Assistant
            </Link>
          </div>

        </motion.div>
      </div>    </div>
  );
}
