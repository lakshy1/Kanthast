import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaIdBadge,
  FaPhoneAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaPencilAlt,
  FaSave,
  FaCheckCircle,
  FaChevronDown,
} from "react-icons/fa";
import { getProfile, updateProfile } from "../utils/authApi";
import { ProfileSkeleton } from "../components/DataLoaderSkeletons";
import { trackAnalyticsEvent, useAppSettings } from "../utils/settings";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MAX_ABOUT = 500;

export default function Profile() {
  const token = localStorage.getItem("kanthastToken");
  const settings = useAppSettings();
  const compact = settings.compactLayout;
  const profileVisibility = settings.profileVisibility;
  const privacyIsPublic = profileVisibility === "public";
  const MotionSection = motion.section;
  const MotionDiv = motion.div;

  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [user, setUser] = useState(localUser);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ about: "", gender: "", dateOfBirth: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        setStatus("error");
        setError("Login required to view profile.");
        return;
      }
      try {
        const data = await getProfile(token);
        if (!mounted) return;
        const userData = data.user || localUser;
        const profileData = data.profile || null;
        setUser(userData);
        localStorage.setItem("kanthastUser", JSON.stringify(userData));
        setProfile(profileData);
        setForm({
          about: profileData?.about || "",
          gender: profileData?.gender || "",
          dateOfBirth: toInputDate(profileData?.dateOfBirth),
        });
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(err.message || "Unable to load profile.");
      }
    };
    load();
    return () => { mounted = false; };
  }, [token, localUser]);

  const initials = (`${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`).toUpperCase()
    || user?.firstName?.[0]?.toUpperCase() || "U";
  const avatarPalette = ["#0ea5e9", "#14b8a6", "#2563eb", "#ef4444", "#0f766e", "#f59e0b"];
  const seed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarColor = avatarPalette[seed % avatarPalette.length];

  const joinedAt = user?.joinedAt || (user?._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : null);
  const subscriptionPurchased = Boolean(user?.subscriptionPurchased);
  const emailParts = String(user?.email || "").split("@");
  const maskedEmail = privacyIsPublic || emailParts.length < 2
    ? (user?.email || "No email available")
    : `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`;
  const rawPhone = profile?.contactNumber || user?.contactNumber || "";
  const maskedPhone = privacyIsPublic || !rawPhone
    ? (rawPhone || "-")
    : `${String(rawPhone).slice(0, 2)}******`;

  const hasChanges =
    form.about !== (profile?.about || "") ||
    form.gender !== (profile?.gender || "") ||
    form.dateOfBirth !== toInputDate(profile?.dateOfBirth);

  const onSave = async () => {
    if (!token || !hasChanges) return;
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        about: form.about,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        contactNumber: profile?.contactNumber || user?.contactNumber || "",
      };
      const data = await updateProfile(token, payload);
      const updatedProfile = data.profile || profile;
      const updatedUser = data.user || user;
      setProfile(updatedProfile);
      setUser(updatedUser);
      localStorage.setItem("kanthastUser", JSON.stringify(updatedUser));
      trackAnalyticsEvent("profile_updated", { userId: updatedUser?._id });
      setToast("Profile updated successfully.");
      setTimeout(() => setToast(null), 2500);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#f8fafc_38%,_#ecfeff_86%)] ${compact ? "px-3 md:px-6 py-6" : "px-4 md:px-8 py-8"}`}>
      <div className="max-w-6xl mx-auto">

        {/* ── HERO CARD ── */}
        <MotionSection
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden shadow-[0_28px_60px_rgba(15,23,42,0.09)]"
        >
          {/* Banner with avatar + name + pills all inline */}
          <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 relative px-4 sm:px-6 md:px-8 py-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(255,255,255,0.14),transparent_55%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/40 shadow-xl grid place-items-center text-white text-2xl sm:text-3xl font-black shrink-0"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">Profile</p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-0.5 truncate">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm mt-0.5 truncate">{maskedEmail}</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
                <MetaPill icon={<FaCalendarAlt />} label="Joined" value={formatDate(joinedAt)} />
                <MetaPill
                  icon={<FaIdBadge />}
                  label="Visibility"
                  value={
                    profileVisibility === "public"
                      ? "Public"
                      : profileVisibility === "private"
                        ? "Private"
                        : "Enrolled learners"
                  }
                />
              </div>
            </div>
          </div>
        </MotionSection>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-stone-700">
          <p className="font-semibold text-stone-900">Privacy mode: {profileVisibility}</p>
          <p className="mt-1 text-sm text-stone-600">
            Contact details are {privacyIsPublic ? "shown" : "masked"} on this page to match your visibility setting.
          </p>
        </div>

        {status === "loading" && <ProfileSkeleton />}

        {status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        )}

        {status === "ready" && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: "easeOut" }}
            className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:items-stretch"
          >
            {/* ── PERSONAL INFORMATION ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                <button
                  onClick={() => setIsEditing((prev) => !prev)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                    isEditing
                      ? "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                  }`}
                >
                  <FaPencilAlt className="text-xs" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FieldCard icon={<FaUserCircle />} iconBg="bg-blue-100" iconColor="text-blue-600" label="First Name" value={user?.firstName || "-"} />
                <FieldCard icon={<FaUserCircle />} iconBg="bg-blue-100" iconColor="text-blue-600" label="Last Name" value={user?.lastName || "-"} />
                <FieldCard icon={<FaEnvelope />} iconBg="bg-cyan-100" iconColor="text-cyan-600" label="Email Address" value={maskedEmail} />
                <FieldCard
                  icon={<FaPhoneAlt />} iconBg="bg-slate-100" iconColor="text-slate-600"
                  label="Contact Number"
                  value={maskedPhone}
                />
                <FieldCard
                  icon={subscriptionPurchased ? <FaCheckCircle /> : <FaIdBadge />}
                  iconBg={subscriptionPurchased ? "bg-emerald-100" : "bg-amber-100"}
                  iconColor={subscriptionPurchased ? "text-emerald-600" : "text-amber-600"}
                  label="Subscription"
                  value={subscriptionPurchased ? "Active" : "Not Purchased"}
                  variant={subscriptionPurchased ? "success" : "warning"}
                />
                <FieldCard
                  icon={<FaCalendarAlt />} iconBg="bg-purple-100" iconColor="text-purple-600"
                  label="Purchased On"
                  value={subscriptionPurchased ? formatDate(user?.subscriptionPurchasedOn) : "-"}
                />
                <FieldCard
                  icon={<FaCalendarAlt />} iconBg="bg-indigo-100" iconColor="text-indigo-600"
                  label="Valid Till"
                  value={subscriptionPurchased ? formatDate(user?.subscriptionValidTill) : "-"}
                />

                <EditableField label="Gender" icon={<FaIdBadge />} iconBg="bg-pink-100" iconColor="text-pink-600">
                  {isEditing ? (
                    <CustomSelect
                      value={form.gender}
                      onChange={(val) => setForm((prev) => ({ ...prev, gender: val }))}
                      options={[
                        { value: "", label: "Select" },
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 font-semibold">{profile?.gender || "-"}</p>
                  )}
                </EditableField>

                <EditableField label="Date of Birth" icon={<FaCalendarAlt />} iconBg="bg-orange-100" iconColor="text-orange-600">
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  ) : (
                    <p className="mt-1 text-slate-900 font-semibold">{formatDate(profile?.dateOfBirth)}</p>
                  )}
                </EditableField>
              </div>
            </section>

            {/* ── ABOUT ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)] flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900">About</h2>

              {isEditing ? (
                <div className="mt-4 flex flex-col flex-1">
                  <textarea
                    value={form.about}
                    onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value.slice(0, MAX_ABOUT) }))}
                    rows={8}
                    placeholder="Tell us about your goals, strengths, and learning style..."
                    className="w-full flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  />
                  <p className={`text-xs text-right mt-1 ${form.about.length >= MAX_ABOUT ? "text-red-500" : "text-slate-400"}`}>
                    {form.about.length}/{MAX_ABOUT}
                  </p>
                </div>
              ) : profile?.about ? (
                <p className="mt-4 text-slate-600 leading-relaxed flex-1">{profile.about}</p>
              ) : (
                <div className="mt-4 flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 px-4 text-center">
                  <FaPencilAlt className="text-slate-300 text-2xl mb-3" />
                  <p className="text-slate-500 font-medium">No bio yet</p>
                  <p className="text-slate-400 text-sm mt-1">Click Edit Profile to add your goals and learning style.</p>
                </div>
              )}

              <AnimatePresence>
                {(isEditing || hasChanges) && (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <FaSave />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </motion.button>
                )}
              </AnimatePresence>

              {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
            </section>
          </MotionDiv>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-500 px-5 py-3 text-white shadow-[0_14px_30px_rgba(16,185,129,0.32)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 backdrop-blur px-3 py-2 shrink-0">
      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white grid place-items-center text-xs sm:text-sm shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/65 font-medium">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function FieldCard({ icon, iconBg = "bg-slate-100", iconColor = "text-slate-500", label, value, variant }) {
  const cardStyle = variant === "success"
    ? "border-emerald-200 bg-emerald-50/60"
    : variant === "warning"
    ? "border-amber-200 bg-amber-50/60"
    : "border-slate-200 bg-slate-50";
  const valueColor = variant === "success"
    ? "text-emerald-700"
    : variant === "warning"
    ? "text-amber-700"
    : "text-slate-900";

  return (
    <div className={`rounded-xl border px-4 py-3 hover:shadow-md hover:border-slate-300 transition-all duration-200 ${cardStyle}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </span>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      </div>
      <p className={`font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedLabel = (() => {
    const match = options.find((o) => (typeof o === "string" ? o : o.value) === value);
    return match ? (typeof match === "string" ? match : match.label) : (value || "Select");
  })();

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-medium text-slate-900 transition-all duration-150 ${
          open ? "border-cyan-400 ring-2 ring-cyan-100 bg-white" : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{selectedLabel}</span>
        <FaChevronDown className={`shrink-0 text-slate-400 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.13)] overflow-hidden">
          {options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            const isActive = optValue === value;
            return (
              <button
                key={optValue ?? optLabel}
                type="button"
                onClick={() => { onChange(optValue); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-cyan-50 text-cyan-700 font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{optLabel}</span>
                {isActive && <span className="text-xs text-cyan-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditableField({ icon, iconBg = "bg-slate-100", iconColor = "text-slate-500", label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </span>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      </div>
      {children}
    </div>
  );
}
