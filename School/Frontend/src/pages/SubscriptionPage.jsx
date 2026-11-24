import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  getSchoolClassLabel,
  getSelectedSchoolClass,
  schoolClassOptions,
  setSelectedSchoolClass,
} from "../utils/schoolCatalogData";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";

export default function SubscriptionPage() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null");
    } catch {
      return null;
    }
  });

  const [selectedClass, setSelectedClass] = useState(getSelectedSchoolClass());
  const classLabel = getSchoolClassLabel(selectedClass);
  const activeClass = user?.schoolClass || "";
  const hasClassSubscription = Boolean(
    user?.subscriptionPurchased && activeClass
  );

  const selectClass = (value) => {
    setSelectedClass(value);
    setSelectedSchoolClass(value);
  };

  return (
    <div className="min-h-screen bg-[#f7fbff] px-4 py-10 md:px-8">
      <Helmet>
        <title>Plans | Kanthast School for Classes VIII to X</title>
        <meta
          name="description"
          content="Choose a class from I-X and activate Kanthast School annual access for Rs 5,000."
        />
      </Helmet>

      <div className="page-frame">
        <section className="rounded-sheet border border-[#edf1fa] bg-surface p-6 shadow-e5 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Eyebrow>Kanthast School plan</Eyebrow>
              <h1 className="kx-title mt-4 text-3xl md:text-5xl">
                Choose class. Pay once. Learn all <Accent>year</Accent>
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Annual access unlocks the selected class content in the Library and Dashboard. Each student gets one
                focused class plan for clean progress tracking.
              </p>
            </div>
            <div className="rounded-card border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm font-semibold text-blue-800">Current status</p>
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
                          ? "border-blue-400 bg-blue-50 text-blue-900 shadow-glow-brand"
                          : "border-line bg-surface text-ink-muted hover:border-blue-200"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle">Class</span>
                      <p className="mt-1 text-lg font-black">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-card border border-[#edf1fa] bg-surface p-6 text-ink shadow-e3">
              <p className="inline-flex rounded-full bg-[#fff4db] px-3 py-1 text-sm font-bold text-[#8a5a00]">Annual access</p>
              <h2 className="kx-title mt-3 text-2xl">{classLabel}</h2>
              <p className="kx-title mt-4 text-5xl">Rs 5,000</p>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Unlocks all subjects and class-specific chapters for one academic year.
              </p>
              <button type="button" disabled className="btn-primary mt-6 w-full cursor-not-allowed font-bold opacity-60">
                Coming soon
              </button>
              <p className="mt-3 text-center text-xs text-ink-subtle">
                Online payments open soon. Nothing is charged today.
              </p>
              <Link to="/courses" className="mt-3 block text-center text-sm font-semibold text-brand hover:text-brand-hover">
                Review all classes
              </Link>
            </aside>
          </div>

        </section>
      </div>
    </div>
  );
}
