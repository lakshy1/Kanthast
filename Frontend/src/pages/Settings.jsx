import { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBookOpen,
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
import { Button, Field, LiveRegion, Modal, Select, Toggle } from "../components/ui";

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
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3 py-2.5 shadow-e1 min-w-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-sunken text-ink-muted text-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-micro uppercase tracking-[0.15em] text-ink-subtle truncate">{label}</p>
        <p className="font-semibold text-ink text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

/** The 10 preference switches, in the bordered shell the page has always used. */
function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-fast ease-brand hover:bg-surface-sunken">
      <Toggle label={label} description={description} checked={checked} onChange={onChange} />
    </div>
  );
}

function getAccentClasses(accent) {
  switch (accent) {
    case "blue":
      return {
        shell: "border-blue-100 bg-gradient-to-br from-surface via-surface-sunken to-blue-50/40",
        icon: "border-blue-100 bg-blue-50 text-blue-700",
        title: "text-blue-950",
        eyebrow: "text-blue-700",
      };
    case "emerald":
      return {
        shell: "border-emerald-100 bg-gradient-to-br from-surface via-surface-sunken to-emerald-50/40",
        icon: "border-emerald-100 bg-emerald-50 text-emerald-700",
        title: "text-emerald-950",
        eyebrow: "text-emerald-700",
      };
    case "cyan":
    default:
      return {
        shell: "border-cyan-100 bg-gradient-to-br from-surface via-surface-sunken to-cyan-50/40",
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
      className={`rounded-3xl border p-5 sm:p-6 shadow-e3 ${accentClasses.shell}`}
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
          <p className="mt-0.5 text-sm text-ink-subtle">{description}</p>
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
      ? "border-blue-200 bg-blue-50 text-blue-950 shadow-e1 ring-1 ring-blue-100"
      : accent === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-e1 ring-1 ring-emerald-100"
        : "border-cyan-200 bg-cyan-50 text-cyan-950 shadow-e1 ring-1 ring-cyan-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-touch items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors duration-fast ease-brand ${
        active
          ? activeClasses
          : "border border-transparent bg-transparent text-ink-subtle hover:border-line hover:bg-surface hover:text-ink"
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

function SessionCard({ session, onLogout, revokingSessionId }) {
  const isThisDevice = Boolean(session.isCurrent);
  const isActive = Boolean(session.isActive);

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{session.deviceName}</p>
            {isThisDevice && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.12em] text-emerald-700">
                This device
              </span>
            )}
            {!isActive && (
              <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                Signed out
              </span>
            )}
          </div>
          <p className="text-sm text-ink-subtle">
            {session.browserName} on {session.osName}
          </p>
          <p className="text-sm text-ink-subtle">
            IP: {session.ipAddress || "-"} | Location: {session.locationLabel || "Unknown"}
          </p>
          <p className="text-sm text-ink-subtle">
            Logged in: {formatDateTime(session.startedAt)} | Last seen: {formatDateTime(session.lastSeenAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-subtle">Session ID</p>
            <p className="text-sm font-mono text-ink-muted">{session.sessionId}</p>
          </div>
          {!isThisDevice && isActive && (
            <Button
              variant="secondary"
              onClick={() => onLogout(session.sessionId)}
              disabled={revokingSessionId === session.sessionId}
              loading={revokingSessionId === session.sessionId}
              loadingText="Logging out..."
            >
              Logout
            </Button>
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
  // Inline field errors, so validation is not toast-only (announced + painted).
  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteError, setDeleteError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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
      setPasswordErrors({
        currentPassword: passwordForm.currentPassword ? "" : "Required",
        newPassword: passwordForm.newPassword ? "" : "Required",
        confirmNewPassword: passwordForm.confirmNewPassword ? "" : "Required",
      });
      setStatusMessage("Fill in all password fields");
      toast.error("Fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErrors({ confirmNewPassword: "New passwords do not match" });
      setStatusMessage("New passwords do not match");
      toast.error("New passwords do not match");
      return;
    }

    setPasswordErrors({});
    setChangingPassword(true);
    try {
      await changePasswordApi(token, passwordForm);
      setPasswordForm(emptyPasswordForm);
      setStatusMessage("Password changed successfully");
      toast.success("Password changed successfully");
    } catch (error) {
      setPasswordErrors({ currentPassword: error.message || "Failed to change password" });
      setStatusMessage(error.message || "Failed to change password");
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Opens the confirmation dialog; the destructive work happens on confirm.
  const handleDeleteAccount = () => {
    if (!token) return;
    if (deleteDisabled) {
      setDeleteError("Type your email to confirm deletion");
      setStatusMessage("Type your email to confirm deletion");
      toast.error("Type your email to confirm deletion");
      return;
    }
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!token || deleteDisabled) return;

    setDeleteModalOpen(false);
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
      <div className="min-h-screen bg-surface-sunken px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 rounded-3xl border border-line bg-surface animate-pulse" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 rounded-3xl border border-line bg-surface animate-pulse" />
            <div className="h-64 rounded-3xl border border-line bg-surface animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-8 md:px-8">
      <LiveRegion message={statusMessage} />
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-surface via-surface-sunken to-cyan-50/40 p-6 shadow-e3 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-lg font-black text-white shadow-e3">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Account settings</p>
                <h1 className="mt-1 text-2xl font-black text-ink md:text-4xl">
                  {user?.firstName || "Your"} settings
                </h1>
                <p className="mt-1 text-sm text-ink-subtle hidden sm:block">
                  Manage account details, password, sessions, privacy, and learning preferences.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-wrap gap-3">
              <Link
                to="/profile"
                className="inline-flex min-h-touch items-center gap-2 rounded-xl border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink-muted transition-colors duration-fast ease-brand hover:bg-surface"
              >
                <FaUserCircle />
                Profile
              </Link>
              <Link
                to="/subscription"
                className="inline-flex min-h-touch items-center gap-2 rounded-xl border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink-muted transition-colors duration-fast ease-brand hover:bg-surface"
              >
                <FaBookOpen />
                Subscription
              </Link>
              <Link
                to="/chatbot"
                className="inline-flex min-h-touch items-center gap-2 rounded-xl border border-line bg-surface-sunken px-4 py-2.5 text-sm text-ink-muted transition-colors duration-fast ease-brand hover:bg-surface"
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

        <div className="sticky top-4 z-20 mt-4 overflow-hidden rounded-3xl border border-line bg-surface/90 p-2 shadow-e3 backdrop-blur-xl">
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
                      : "bg-surface-sunken text-ink-muted"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="flex flex-col items-start">
                  <span>{tab.label}</span>
                  <span
                    className={`hidden sm:block text-micro font-medium transition ${
                      activeTab === tab.id
                        ? tab.accent === "cyan"
                          ? "text-cyan-700"
                          : tab.accent === "blue"
                            ? "text-blue-700"
                            : "text-emerald-700"
                        : "text-ink-subtle"
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
                  <Button
                    fullWidth
                    onClick={saveAccount}
                    disabled={!hasAccountChanges || savingAccount}
                    loading={savingAccount}
                    loadingText="Saving..."
                  >
                    Save account
                  </Button>
                }
              >
                <form onSubmit={saveAccount} className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="First name"
                    value={accountForm.firstName}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  <Field
                    label="Last name"
                    value={accountForm.lastName}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  <Field
                    label="Email address"
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    autoComplete="email"
                  />
                  <Field
                    label="Contact number"
                    type="tel"
                    inputMode="tel"
                    value={accountForm.contactNumber}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="Contact number"
                    autoComplete="tel"
                  />
                </form>
                <p className="mt-4 text-sm text-ink-subtle">
                  Bio, gender, and date of birth are still available on your profile page.
                </p>
              </SectionCard>

              <SectionCard
                accent="cyan"
                icon={<FaBell />}
                title="Notifications"
                description="Choose how Kanthast reaches you about learning and account activity."
                actions={
                  <Button
                    fullWidth
                    onClick={savePreferences}
                    disabled={!hasPreferenceChanges || savingPreferences}
                    loading={savingPreferences}
                    loadingText="Saving..."
                  >
                    Save preferences
                  </Button>
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
                  <Select
                    label="Language"
                    value={preferences.language}
                    onChange={(val) => setPreferences((prev) => ({ ...prev, language: val }))}
                    options={["English", "Hindi", "Spanish"]}
                  />
                  <Select
                    label="Appearance"
                    value={preferences.appearance}
                    onChange={(val) => setPreferences((prev) => ({ ...prev, appearance: val }))}
                    options={["System", "Light", "Dark"]}
                  />
                  <Select
                    label="Default playback speed"
                    value={preferences.defaultPlaybackSpeed}
                    onChange={(val) => setPreferences((prev) => ({ ...prev, defaultPlaybackSpeed: val }))}
                    options={["1x", "1.25x", "1.5x", "2x"]}
                  />
                  <Select
                    label="Profile visibility"
                    value={preferences.profileVisibility}
                    onChange={(val) => setPreferences((prev) => ({ ...prev, profileVisibility: val }))}
                    options={[
                      { value: "public", label: "Public" },
                      { value: "enrolled", label: "Enrolled learners only" },
                      { value: "private", label: "Private" },
                    ]}
                  />
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
                  <Button
                    fullWidth
                    onClick={changePassword}
                    disabled={changingPassword}
                    loading={changingPassword}
                    loadingText="Updating..."
                  >
                    Change password
                  </Button>
                }
              >
                <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Current password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Current password"
                    autoComplete="current-password"
                    error={passwordErrors.currentPassword}
                  />
                  <Field
                    label="New password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="New password"
                    autoComplete="new-password"
                    error={passwordErrors.newPassword}
                  />
                  <Field
                    label="Confirm new password"
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    error={passwordErrors.confirmNewPassword}
                  />
                </form>
              </SectionCard>

              <SectionCard
                accent="blue"
                icon={<FaMobileAlt />}
                title="Active sessions"
                description="See where your account is logged in and revoke other devices."
                actions={
                  <Button
                    fullWidth
                    onClick={handleLogoutOtherSessions}
                    disabled={revokingOtherSessions}
                    loading={revokingOtherSessions}
                    loadingText="Logging out..."
                  >
                    Logout other sessions
                  </Button>
                }
              >
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-sunken px-4 py-3 text-sm text-ink-muted">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-ink-muted" aria-hidden="true" />
                      <span>
                        Location accuracy is based on GPS when allowed, otherwise IP-based location is shown.
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={refreshSessions}
                      disabled={loadingSessions}
                      loading={loadingSessions}
                      loadingText="Refreshing..."
                    >
                      Refresh
                    </Button>
                  </div>

                  {loadingSessions ? (
                    <div className="rounded-2xl border border-line bg-surface px-4 py-4 text-sm text-ink-subtle">
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
                    <div className="rounded-2xl border border-line bg-surface px-4 py-4 text-sm text-ink-subtle">
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
                  <div className="rounded-2xl border border-line bg-surface-sunken px-4 py-4">
                    <p className="font-semibold text-ink">Subscription state</p>
                    <p className="mt-1 text-sm text-ink-subtle">
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
                <div className="rounded-3xl border border-line bg-surface-sunken p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-ink-muted" aria-hidden="true" />
                        <h3 className="text-lg font-bold text-ink">Current visibility</h3>
                      </div>
                      <p className="mt-1 text-sm text-ink-subtle">{visibilityLabel}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-ink-subtle">
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
                <div className="rounded-3xl border border-line bg-surface-sunken p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface text-ink-muted">
                      <FaTrash aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-ink">Delete account</h3>
                      <p className="mt-1 text-sm text-ink-subtle">
                        Permanently remove your account, login, profile, and access to the platform.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <Field
                          label="Confirm with your email address"
                          type="email"
                          value={deleteConfirm}
                          onChange={(e) => {
                            setDeleteConfirm(e.target.value);
                            if (deleteError) setDeleteError("");
                          }}
                          placeholder="Type your email to confirm"
                          autoComplete="email"
                          hint="This permanently deletes your account. It cannot be undone."
                          error={deleteError}
                        />
                        <Button
                          variant="danger"
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount || deleteDisabled}
                          loading={deletingAccount}
                          loadingText="Deleting..."
                        >
                          <span className="inline-flex items-center gap-2">
                            <FaSignOutAlt aria-hidden="true" />
                            Delete account
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete your account?"
        description="This will permanently delete your account, profile, and login access. This action cannot be undone."
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteAccount} disabled={deletingAccount}>
              Delete account
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-muted">
          Everything tied to {user?.email || "this account"} will be removed, including your profile,
          saved progress, and subscription access.
        </p>
      </Modal>
    </div>
  );
}
