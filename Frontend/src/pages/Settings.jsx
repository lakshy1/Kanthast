import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBell,
  FaBookOpen,
  FaChevronDown,
  FaClock,
  FaDatabase,
  FaLock,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaPalette,
  FaRobot,
  FaShieldAlt,
  FaSignOutAlt,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  changePassword as changePasswordApi,
  deleteAccount as deleteAccountApi,
  getActiveSessions as getActiveSessionsApi,
  getProfile,
  getSettings as getSettingsApi,
  logoutOtherSessions as logoutOtherSessionsApi,
  logoutSession as logoutSessionApi,
  updateProfile,
  updateSettings as updateSettingsApi,
} from "../utils/authApi";
import { defaultSettings, readStoredSettings, trackAnalyticsEvent, writeStoredSettings } from "../utils/settings";

const emptyAccountForm = {
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm min-w-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-700 text-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 truncate">{label}</p>
        <p className="font-semibold text-stone-900 text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left transition hover:border-stone-300 hover:bg-stone-50"
    >
      <div>
        <p className="font-semibold text-stone-900">{label}</p>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      <span
        className={`mt-1 flex h-6 w-11 items-center rounded-full p-0.5 transition ${
          checked ? "bg-stone-900" : "bg-stone-300"
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function getAccentClasses(accent) {
  switch (accent) {
    case "blue":
      return {
        shell: "border-blue-100 bg-gradient-to-br from-white via-stone-50 to-blue-50/40",
        icon: "border-blue-100 bg-blue-50 text-blue-700",
        title: "text-blue-950",
        eyebrow: "text-blue-700",
      };
    case "emerald":
      return {
        shell: "border-emerald-100 bg-gradient-to-br from-white via-stone-50 to-emerald-50/40",
        icon: "border-emerald-100 bg-emerald-50 text-emerald-700",
        title: "text-emerald-950",
        eyebrow: "text-emerald-700",
      };
    case "cyan":
    default:
      return {
        shell: "border-cyan-100 bg-gradient-to-br from-white via-stone-50 to-cyan-50/40",
        icon: "border-cyan-100 bg-cyan-50 text-cyan-700",
        title: "text-cyan-950",
        eyebrow: "text-cyan-700",
      };
  }
}

function SectionCard({ accent = "cyan", icon, title, description, children, actions }) {
  const accentClasses = getAccentClasses(accent);
  return (
    <section
      className={`rounded-3xl border p-5 sm:p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${accentClasses.shell}`}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${accentClasses.icon}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accentClasses.eyebrow}`}>
            {accent === "cyan" ? "General" : accent === "blue" ? "Security" : "Privacy"}
          </p>
          <h2 className={`mt-0.5 text-xl sm:text-2xl font-black ${accentClasses.title}`}>{title}</h2>
          <p className="mt-0.5 text-sm text-stone-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
      {actions && (
        <div className="mt-5">{actions}</div>
      )}
    </section>
  );
}

function TabButton({ active, accent = "cyan", children, onClick }) {
  const activeClasses =
    accent === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-100"
      : accent === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-100"
        : "border-cyan-200 bg-cyan-50 text-cyan-950 shadow-sm ring-1 ring-cyan-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition ${
        active
          ? activeClasses
          : "border border-transparent bg-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

const sectionTabs = [
  {
    id: "general",
    label: "General",
    subtitle: "Account and learning",
    icon: <FaUserCircle className="text-base" />,
    accent: "cyan",
  },
  {
    id: "security",
    label: "Security",
    subtitle: "Password and sessions",
    icon: <FaLock className="text-base" />,
    accent: "blue",
  },
  {
    id: "privacy",
    label: "Privacy",
    subtitle: "Data and visibility",
    icon: <FaDatabase className="text-base" />,
    accent: "emerald",
  },
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function CustomSelect({ value, onChange, options, accent = "cyan" }) {
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
    return match ? (typeof match === "string" ? match : match.label) : String(value);
  })();

  const focusRing =
    accent === "blue" ? "border-blue-400 ring-2 ring-blue-100" :
    accent === "emerald" ? "border-emerald-400 ring-2 ring-emerald-100" :
    "border-cyan-400 ring-2 ring-cyan-100";

  const activeOption =
    accent === "blue" ? "bg-blue-50 text-blue-700 font-semibold" :
    accent === "emerald" ? "bg-emerald-50 text-emerald-700 font-semibold" :
    "bg-cyan-50 text-cyan-700 font-semibold";

  const checkColor =
    accent === "blue" ? "text-blue-500" :
    accent === "emerald" ? "text-emerald-500" :
    "text-cyan-500";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium text-stone-900 transition-all duration-150 ${
          open ? `bg-white ${focusRing}` : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white"
        }`}
      >
        <span>{selectedLabel}</span>
        <FaChevronDown className={`shrink-0 text-stone-400 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-stone-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.13)] overflow-hidden">
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
                  isActive ? activeOption : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <span>{optLabel}</span>
                {isActive && <span className={`text-xs ${checkColor}`}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onLogout, revokingSessionId }) {
  const isThisDevice = Boolean(session.isCurrent);
  const isActive = Boolean(session.isActive);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-stone-900">{session.deviceName}</p>
            {isThisDevice && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                This device
              </span>
            )}
            {!isActive && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Signed out
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500">
            {session.browserName} on {session.osName}
          </p>
          <p className="text-sm text-stone-500">
            IP: {session.ipAddress || "-"} | Location: {session.locationLabel || "Unknown"}
          </p>
          <p className="text-sm text-stone-500">
            Logged in: {formatDateTime(session.startedAt)} | Last seen: {formatDateTime(session.lastSeenAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Session ID</p>
            <p className="text-sm font-mono text-stone-700">{session.sessionId}</p>
          </div>
          {!isThisDevice && isActive && (
            <button
              type="button"
              onClick={() => onLogout(session.sessionId)}
              disabled={revokingSessionId === session.sessionId}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {revokingSessionId === session.sessionId ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("kanthastToken");
  const rawUser = localStorage.getItem("kanthastUser");

  const localUser = useMemo(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, [rawUser]);

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [revokingOtherSessions, setRevokingOtherSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState(localUser);
  const [profile, setProfile] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [preferences, setPreferences] = useState(readStoredSettings());
  const [savedPreferences, setSavedPreferences] = useState(readStoredSettings());
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [profileData, settingsData, sessionsData] = await Promise.all([
          getProfile(token),
          getSettingsApi(token).catch(() => null),
          getActiveSessionsApi(token).catch(() => null),
        ]);

        if (!mounted) return;

        const nextUser = profileData.user || localUser;
        const nextProfile = profileData.profile || null;
        const nextSettings = settingsData?.settings || nextUser?.settings || readStoredSettings();

        setUser(nextUser);
        setProfile(nextProfile);
        setPreferences(nextSettings);
        setSavedPreferences(nextSettings);
        writeStoredSettings(nextSettings);
        setSessions(sessionsData?.sessions || []);
        setAccountForm({
          firstName: nextUser?.firstName || "",
          lastName: nextUser?.lastName || "",
          email: nextUser?.email || "",
          contactNumber: nextUser?.contactNumber || nextProfile?.contactNumber || "",
        });
      } catch (error) {
        if (!mounted) return;
        toast.error(error.message || "Failed to load settings");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token, navigate, localUser]);

  const hasAccountChanges = useMemo(() => {
    const nextFirst = user?.firstName || "";
    const nextLast = user?.lastName || "";
    const nextEmail = user?.email || "";
    const nextContact = user?.contactNumber || profile?.contactNumber || "";
    return (
      accountForm.firstName !== nextFirst ||
      accountForm.lastName !== nextLast ||
      accountForm.email !== nextEmail ||
      accountForm.contactNumber !== nextContact
    );
  }, [accountForm, user, profile]);

  const hasPreferenceChanges = useMemo(
    () => JSON.stringify(savedPreferences) !== JSON.stringify(preferences),
    [preferences, savedPreferences]
  );

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const subscriptionPurchased = Boolean(user?.subscriptionPurchased);
  const deleteDisabled = deleteConfirm.trim().toLowerCase() !== (user?.email || "").toLowerCase();
  const visibilityLabel =
    preferences.profileVisibility === "public"
      ? "Public"
      : preferences.profileVisibility === "enrolled"
        ? "Enrolled learners only"
        : "Private";

  const saveAccount = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSavingAccount(true);
    try {
      const data = await updateProfile(token, {
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        email: accountForm.email,
        contactNumber: accountForm.contactNumber,
      });

      const nextUser = data.user || user;
      const nextProfile = data.profile || profile;
      setUser(nextUser);
      setProfile(nextProfile);
      localStorage.setItem("kanthastUser", JSON.stringify(nextUser));
      trackAnalyticsEvent("account_profile_updated", { userId: nextUser?._id });
      toast.success("Account details updated");
    } catch (error) {
      toast.error(error.message || "Failed to update account");
    } finally {
      setSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    if (!token) return;

    setSavingPreferences(true);
    try {
      const data = await updateSettingsApi(token, preferences);
      const nextSettings = data.settings || preferences;
      setPreferences(nextSettings);
      setSavedPreferences(nextSettings);
      setUser((prev) => (prev ? { ...prev, settings: nextSettings } : prev));
      writeStoredSettings(nextSettings);
      trackAnalyticsEvent("settings_updated", { settings: nextSettings });
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  const refreshSessions = async () => {
    if (!token) return;
    setLoadingSessions(true);
    try {
      const data = await getActiveSessionsApi(token);
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error(error.message || "Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutOtherSessions = async () => {
    if (!token) return;
    setRevokingOtherSessions(true);
    try {
      await logoutOtherSessionsApi(token);
      toast.success("Other sessions logged out");
      await refreshSessions();
    } catch (error) {
      toast.error(error.message || "Failed to log out other sessions");
    } finally {
      setRevokingOtherSessions(false);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    if (!token || !sessionId) return;
    setRevokingSessionId(sessionId);
    try {
      await logoutSessionApi(token, sessionId);
      toast.success("Session logged out");
      await refreshSessions();
    } catch (error) {
      toast.error(error.message || "Failed to log out session");
    } finally {
      setRevokingSessionId("");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      toast.error("Fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await changePasswordApi(token, passwordForm);
      setPasswordForm(emptyPasswordForm);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    if (deleteDisabled) {
      toast.error("Type your email to confirm deletion");
      return;
    }

    const confirmed = window.confirm(
      "This will permanently delete your account, profile, and login access. This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      await deleteAccountApi(token);
      [
        "kanthastToken",
        "kanthastUser",
        "kanthastWatched",
        "kanthastStreak",
        "kanthastVisited",
        "kanthastContentCache",
      ].forEach((key) => localStorage.removeItem(key));
      writeStoredSettings(defaultSettings);
      sessionStorage.removeItem("kanthastSkipNextLoader");
      toast.success("Account deleted");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 rounded-3xl border border-stone-200 bg-white animate-pulse" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 rounded-3xl border border-stone-200 bg-white animate-pulse" />
            <div className="h-64 rounded-3xl border border-stone-200 bg-white animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-stone-50 to-cyan-50/40 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-lg font-black text-white shadow-lg shadow-cyan-200/60">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Account settings</p>
                <h1 className="mt-1 text-2xl font-black text-stone-900 md:text-4xl">
                  {user?.firstName || "Your"} settings
                </h1>
                <p className="mt-1 text-sm text-stone-500 hidden sm:block">
                  Manage account details, password, sessions, privacy, and learning preferences.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
              >
                <FaUserCircle />
                Profile
              </Link>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
              >
                <FaBookOpen />
                Subscription
              </Link>
              <Link
                to="/chatbot"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
              >
                <FaRobot />
                Chatbot
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 grid-cols-2">
            <StatChip icon={<FaClock />} label="Joined" value={formatDate(user?.joinedAt || user?.createdAt)} />
            <StatChip
              icon={<FaShieldAlt />}
              label="Subscription"
              value={subscriptionPurchased ? "Active" : "Inactive"}
            />
          </div>
        </section>

        <div className="sticky top-4 z-20 mt-4 overflow-hidden rounded-3xl border border-stone-200 bg-white/90 p-2 shadow-lg backdrop-blur-xl">
          <div className="grid gap-2 grid-cols-3">
            {sectionTabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                accent={tab.accent}
                onClick={() => setActiveTab(tab.id)}
              >
                <span
                  className={`hidden sm:grid h-9 w-9 place-items-center rounded-xl transition ${
                    activeTab === tab.id
                      ? tab.accent === "cyan"
                        ? "bg-cyan-100 text-cyan-700"
                        : tab.accent === "blue"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="flex flex-col items-start">
                  <span>{tab.label}</span>
                  <span
                    className={`hidden sm:block text-[11px] font-medium transition ${
                      activeTab === tab.id
                        ? tab.accent === "cyan"
                          ? "text-cyan-700"
                          : tab.accent === "blue"
                            ? "text-blue-700"
                            : "text-emerald-700"
                        : "text-stone-500"
                    }`}
                  >
                    {tab.subtitle}
                  </span>
                </span>
              </TabButton>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {activeTab === "general" && (
            <>
              <SectionCard
                accent="cyan"
                icon={<FaUserCircle />}
                title="Account basics"
                description="Update the login and identity details used across the platform."
                actions={
                  <button
                    type="button"
                    onClick={saveAccount}
                    disabled={!hasAccountChanges || savingAccount}
                    className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-stone-800"
                  >
                    {savingAccount ? "Saving..." : "Save account"}
                  </button>
                }
              >
                <form onSubmit={saveAccount} className="grid gap-4 md:grid-cols-2">
                  <Field label="First name">
                    <input
                      value={accountForm.firstName}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="First name"
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      value={accountForm.lastName}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="Last name"
                    />
                  </Field>
                  <Field label="Email address">
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="Email address"
                    />
                  </Field>
                  <Field label="Contact number">
                    <input
                      value={accountForm.contactNumber}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="Contact number"
                    />
                  </Field>
                </form>
                <p className="mt-4 text-sm text-stone-500">
                  Bio, gender, and date of birth are still available on your profile page.
                </p>
              </SectionCard>

              <SectionCard
                accent="cyan"
                icon={<FaBell />}
                title="Notifications"
                description="Choose how Kanthast reaches you about learning and account activity."
                actions={
                  <button
                    type="button"
                    onClick={savePreferences}
                    disabled={!hasPreferenceChanges || savingPreferences}
                    className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-stone-800"
                  >
                    {savingPreferences ? "Saving..." : "Save preferences"}
                  </button>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <SettingToggle
                    label="Email updates"
                    description="Receive general announcements and platform updates."
                    checked={preferences.emailUpdates}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, emailUpdates: value }))}
                  />
                  <SettingToggle
                    label="Learning reminders"
                    description="Get nudges to continue your study streak."
                    checked={preferences.learningReminders}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, learningReminders: value }))}
                  />
                  <SettingToggle
                    label="Course announcements"
                    description="Stay informed when content changes or expands."
                    checked={preferences.courseAnnouncements}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, courseAnnouncements: value }))}
                  />
                  <SettingToggle
                    label="Subscription reminders"
                    description="Get alerts when your access is close to expiring."
                    checked={preferences.subscriptionReminders}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, subscriptionReminders: value }))}
                  />
                  <SettingToggle
                    label="Product tips"
                    description="Show occasional tips for features and shortcuts."
                    checked={preferences.productTips}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, productTips: value }))}
                  />
                </div>
              </SectionCard>

              <SectionCard
                accent="cyan"
                icon={<FaPalette />}
                title="Learning and appearance"
                description="Tune the experience to match how you like to study."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Language">
                    <CustomSelect
                      value={preferences.language}
                      onChange={(val) => setPreferences((prev) => ({ ...prev, language: val }))}
                      options={["English", "Hindi", "Spanish"]}
                      accent="cyan"
                    />
                  </Field>
                  <Field label="Appearance">
                    <CustomSelect
                      value={preferences.appearance}
                      onChange={(val) => setPreferences((prev) => ({ ...prev, appearance: val }))}
                      options={["System", "Light", "Dark"]}
                      accent="cyan"
                    />
                  </Field>
                  <Field label="Default playback speed">
                    <CustomSelect
                      value={preferences.defaultPlaybackSpeed}
                      onChange={(val) => setPreferences((prev) => ({ ...prev, defaultPlaybackSpeed: val }))}
                      options={["1x", "1.25x", "1.5x", "2x"]}
                      accent="cyan"
                    />
                  </Field>
                  <Field label="Profile visibility">
                    <CustomSelect
                      value={preferences.profileVisibility}
                      onChange={(val) => setPreferences((prev) => ({ ...prev, profileVisibility: val }))}
                      options={[
                        { value: "public", label: "Public" },
                        { value: "enrolled", label: "Enrolled learners only" },
                        { value: "private", label: "Private" },
                      ]}
                      accent="cyan"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <SettingToggle
                    label="Autoplay next lecture"
                    description="Automatically open the next lesson after one ends."
                    checked={preferences.autoplayNextLecture}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, autoplayNextLecture: value }))}
                  />
                  <SettingToggle
                    label="Show progress percentage"
                    description="Display lesson and chapter completion percentages."
                    checked={preferences.showProgressPercent}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, showProgressPercent: value }))}
                  />
                  <SettingToggle
                    label="Compact layout"
                    description="Use denser cards and tighter spacing."
                    checked={preferences.compactLayout}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, compactLayout: value }))}
                  />
                  <SettingToggle
                    label="Reduce motion"
                    description="Minimize animated transitions across the app."
                    checked={preferences.reduceMotion}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, reduceMotion: value }))}
                  />
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === "security" && (
            <>
              <SectionCard
                accent="blue"
                icon={<FaLock />}
                title="Password and security"
                description="Change your password and keep your login secure."
                actions={
                  <button
                    type="button"
                    onClick={changePassword}
                    disabled={changingPassword}
                    className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-stone-800"
                  >
                    {changingPassword ? "Updating..." : "Change password"}
                  </button>
                }
              >
                <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
                  <Field label="Current password">
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="Current password"
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="New password"
                    />
                  </Field>
                  <Field label="Confirm new password">
                    <input
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-stone-400"
                      placeholder="Confirm new password"
                    />
                  </Field>
                </form>
              </SectionCard>

              <SectionCard
                accent="blue"
                icon={<FaMobileAlt />}
                title="Active sessions"
                description="See where your account is logged in and revoke other devices."
                actions={
                  <button
                    type="button"
                    onClick={handleLogoutOtherSessions}
                    disabled={revokingOtherSessions}
                    className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-stone-800"
                  >
                    {revokingOtherSessions ? "Logging out..." : "Logout other sessions"}
                  </button>
                }
              >
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-stone-700" />
                      <span>
                        Location accuracy is based on GPS when allowed, otherwise IP-based location is shown.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshSessions}
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingSessions ? (
                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-500">
                      Loading sessions...
                    </div>
                  ) : sessions.length ? (
                    sessions.map((session) => (
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        onLogout={handleLogoutSession}
                        revokingSessionId={revokingSessionId}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-500">
                      No session data available yet.
                    </div>
                  )}
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === "privacy" && (
            <>
              <SectionCard
                accent="emerald"
                icon={<FaDatabase />}
                title="Privacy and data"
                description="Review how your data is handled, stored, and removed."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <SettingToggle
                    label="Usage analytics"
                    description="Allow anonymous usage analytics to improve the platform."
                    checked={preferences.analyticsSharing}
                    onChange={(value) => setPreferences((prev) => ({ ...prev, analyticsSharing: value }))}
                  />
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="font-semibold text-stone-900">Subscription state</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {subscriptionPurchased
                        ? `Active until ${formatDate(user?.subscriptionValidTill)}`
                        : "No active subscription"}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                accent="emerald"
                icon={<FaMapMarkerAlt />}
                title="Privacy mode"
                description="Control how much of your account is visible on your profile."
              >
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-stone-700" />
                        <h3 className="text-lg font-bold text-stone-900">Current visibility</h3>
                      </div>
                      <p className="mt-1 text-sm text-stone-500">{visibilityLabel}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-stone-500">
                    Email, phone, and profile details are masked where privacy mode is restrictive.
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                accent="emerald"
                icon={<FaTrash />}
                title="Delete account"
                description="Permanently remove your account, login, profile, and access to the platform."
              >
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-700">
                      <FaTrash />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-stone-900">Delete account</h3>
                      <p className="mt-1 text-sm text-stone-500">
                        Permanently remove your account, login, profile, and access to the platform.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                        <input
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="Type your email to confirm"
                          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-stone-400"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount || deleteDisabled}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white disabled:opacity-60"
                        >
                          <FaSignOutAlt />
                          {deletingAccount ? "Deleting..." : "Delete account"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
