import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaIdBadge,
  FaPhoneAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaPencilAlt,
  FaSave,
} from "react-icons/fa";
import { getProfile, updateProfile } from "../utils/authApi";

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
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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

    return () => {
      mounted = false;
    };
  }, [token, localUser]);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarPalette = ["#0ea5e9", "#14b8a6", "#2563eb", "#ef4444", "#0f766e", "#f59e0b"];
  const seed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarColor = avatarPalette[seed % avatarPalette.length];

  const joinedAt = user?.joinedAt || (user?._id ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000) : null);

  const hasChanges =
    form.about !== (profile?.about || "") ||
    form.gender !== (profile?.gender || "") ||
    form.dateOfBirth !== toInputDate(profile?.dateOfBirth);

  const onSave = async () => {
    if (!token || !hasChanges) return;
    setIsSaving(true);
    setSaveMessage("");
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
      setSaveMessage("Profile updated successfully.");
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
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 md:p-8 shadow-[0_28px_60px_rgba(15,23,42,0.09)]"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full border border-white/30 shadow-md grid place-items-center text-white text-3xl font-black"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-700 font-semibold">Profile</p>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </h1>
                <p className="text-slate-600 mt-1">{user?.email || "No email available"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <MetaPill label="Account Type" value={user?.accountType || "-"} />
              <MetaPill label="Joined" value={formatDate(joinedAt)} />
            </div>
          </div>
        </motion.section>

        {status === "loading" && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading profile...
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        )}

        {status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: "easeOut" }}
            className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6"
          >
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                <button
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <FaPencilAlt />
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <FieldCard icon={<FaUserCircle />} label="First Name" value={user?.firstName || "-"} />
                <FieldCard icon={<FaUserCircle />} label="Last Name" value={user?.lastName || "-"} />
                <FieldCard icon={<FaEnvelope />} label="Email Address" value={user?.email || "-"} />
                <FieldCard
                  icon={<FaPhoneAlt />}
                  label="Contact Number"
                  value={profile?.contactNumber || user?.contactNumber || "-"}
                />

                <EditableField label="Gender" icon={<FaIdBadge />}>
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

                <EditableField label="Date of Birth" icon={<FaCalendarAlt />}>
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
              <h2 className="text-2xl font-bold text-slate-900">About</h2>
              {isEditing ? (
                <textarea
                  value={form.about}
                  onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
                  rows={8}
                  placeholder="Tell us about your goals, strengths, and learning style..."
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              ) : (
                <p className="mt-4 text-slate-600 leading-relaxed">
                  {profile?.about ||
                    "No bio added yet. Use Edit to add your interests, focus areas, and learning goals."}
                </p>
              )}

              {(isEditing || hasChanges) && (
                <button
                  onClick={onSave}
                  disabled={!hasChanges || isSaving}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}

              {saveMessage && <p className="mt-4 text-green-600 font-medium">{saveMessage}</p>}
              {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MetaPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-3 min-w-36">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FieldCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-slate-900 font-semibold">{value}</p>
    </div>
  );
}

function EditableField({ icon, label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 flex items-center gap-2">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}
