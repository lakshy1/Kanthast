import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { purchaseSubscriptionPlan } from "../utils/authApi";
import { trackAnalyticsEvent } from "../utils/settings";
import {
  getSchoolClassLabel,
  getSelectedSchoolClass,
  schoolClassOptions,
  setSelectedSchoolClass,
} from "../utils/schoolCatalogData";

export default function SubscriptionPage() {
  const token = localStorage.getItem("kanthastSchoolToken");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null");
    } catch {
      return null;
    }
  });

  const [selectedClass, setSelectedClass] = useState(getSelectedSchoolClass());
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const classLabel = getSchoolClassLabel(selectedClass);
  const activeClass = user?.schoolClass || "";
  const hasClassSubscription = Boolean(
    user?.subscriptionPurchased && activeClass
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
      localStorage.setItem("kanthastSchoolUser", JSON.stringify(mergedUser));
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

      <div className="page-frame">
        <section className="rounded-card border border-line bg-surface p-6 shadow-e4 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Kanthast School plan</p>
              <h1 className="mt-2 text-3xl font-black text-ink md:text-5xl">
                Choose class. Pay once. Learn all year.
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Annual access unlocks the selected class content in the Library and Dashboard. Each student gets one
                focused class plan for clean progress tracking.
              </p>
            </div>
            <div className="rounded-card border border-cyan-200 bg-cyan-50 px-5 py-4">
              <p className="text-sm font-semibold text-cyan-800">Current status</p>
              <p className="mt-1 font-bold text-ink">
                {hasClassSubscription ? `${getSchoolClassLabel(activeClass)} active` : "No School class active"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink-subtle">Select class</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {schoolClassOptions.map((option) => {
                  const active = selectedClass === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectClass(option.value)}
                      className={`rounded-control border px-4 py-3 text-left transition ${
                        active
                          ? "border-cyan-400 bg-cyan-50 text-cyan-900 shadow-glow-brand"
                          : "border-line bg-surface text-ink-muted hover:border-cyan-200"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle">Class</span>
                      <p className="mt-1 text-lg font-black">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-card border border-line bg-slate-950 p-6 text-white">
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
                className="btn-primary w-full mt-6 font-bold"
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
            <div className="mt-6 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-sm text-ink-muted">
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
