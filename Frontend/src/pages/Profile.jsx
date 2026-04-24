import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";
import { getProfile, updateProfile } from "../utils/authApi";
import { ProfileSkeleton } from "../components/DataLoaderSkeletons";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#f8fafc_38%,_#ecfeff_86%)] px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">

        {/* ── HERO CARD ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur overflow-hidden shadow-[0_28px_60px_rgba(15,23,42,0.09)]"
        >
          {/* Banner with avatar + name + pills all inline */}
          <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 relative px-6 md:px-8 py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(255,255,255,0.14),transparent_55%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-5">
                <div
                  className="w-20 h-20 rounded-full border-4 border-white/40 shadow-xl grid place-items-center text-white text-3xl font-black shrink-0"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">Profile</p>
                  <h1 className="text-3xl md:text-4xl font-black text-white mt-0.5">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </h1>
                  <p className="text-white/70 text-sm mt-1">{user?.email || "No email available"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <MetaPill icon={<FaUserCircle />} label="Account Type" value={user?.accountType || "-"} />
                <MetaPill icon={<FaCalendarAlt />} label="Joined" value={formatDate(joinedAt)} />
              </div>
            </div>
          </div>
        </motion.section>

        {status === "loading" && <ProfileSkeleton />}

        {status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        )}

        {status === "ready" && (
          <motion.div
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

              <div className="grid md:grid-cols-2 gap-4">
                <FieldCard icon={<FaUserCircle />} iconBg="bg-blue-100" iconColor="text-blue-600" label="First Name" value={user?.firstName || "-"} />
                <FieldCard icon={<FaUserCircle />} iconBg="bg-blue-100" iconColor="text-blue-600" label="Last Name" value={user?.lastName || "-"} />
                <FieldCard icon={<FaEnvelope />} iconBg="bg-cyan-100" iconColor="text-cyan-600" label="Email Address" value={user?.email || "-"} />
                <FieldCard
                  icon={<FaPhoneAlt />} iconBg="bg-slate-100" iconColor="text-slate-600"
                  label="Contact Number"
                  value={profile?.contactNumber || user?.contactNumber || "-"}
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
                    <select
                      value={form.gender}
                      onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
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
          </motion.div>
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
    <div className="flex items-center gap-3 rounded-xl border border-white/25 bg-white/15 backdrop-blur px-4 py-2.5">
      <span className="w-8 h-8 rounded-full bg-white/20 text-white grid place-items-center text-sm shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/65 font-medium">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
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
