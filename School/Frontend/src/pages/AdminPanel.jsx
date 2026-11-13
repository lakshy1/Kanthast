import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { FaChartLine, FaCrown, FaEdit, FaSignOutAlt, FaTrash, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteAdminUser, getAdminUsers, updateAdminUser } from "../utils/authApi";
import { Button, EmptyState, Field, LiveRegion, Modal, Select, Toggle } from "../components/ui";

const tabs = [
  { id: "overview", label: "Overview", icon: <FaChartLine /> },
  { id: "users", label: "Users", icon: <FaUsers /> },
  { id: "subscriptions", label: "Subscriptions", icon: <FaCrown /> },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem("kanthastSchoolAdminToken");
  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastSchoolAdminUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [search, setSearch] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setUsersError("");
    try {
      const data = await getAdminUsers(token);
      setUsers(data.users || []);
    } catch (error) {
      const message = error.message || "Failed to load users";
      setUsersError(message);
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) =>
      [u.firstName, u.lastName, u.email, u.accountType].join(" ").toLowerCase().includes(query)
    );
  }, [users, search]);

  const onEdit = (user) => {
    setEditUserId(user._id);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      contactNumber: user.contactNumber || "",
      accountType: user.accountType || "Student",
      subscriptionPurchased: Boolean(user.subscriptionPurchased),
    });
  };

  const onSave = async (userId) => {
    if (!token) return;
    setSaving(true);
    try {
      const data = await updateAdminUser(token, userId, editForm);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...(data.user || {}) } : u)));
      setEditUserId("");
      setStatusMessage("User updated");
      toast.success("User updated");
    } catch (error) {
      const message = error.message || "Failed to update user";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const runDeleteUser = async (userId) => {
    if (!token) return;
    try {
      await deleteAdminUser(token, userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setStatusMessage("User deleted");
      toast.success("User deleted");
    } catch (error) {
      const message = error.message || "Delete failed";
      setStatusMessage(message);
      toast.error(message);
    }
  };

  const onDelete = (user) => {
    if (!token) return;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "this user";
    setPendingAction({
      title: `Delete ${fullName}?`,
      description: "This permanently removes the account and cannot be undone.",
      body: `${fullName}${user.email ? ` (${user.email})` : ""} will be deleted permanently, along with their subscription record and access to the platform.`,
      confirmLabel: "Delete user",
      run: () => runDeleteUser(user._id),
    });
  };

  const onLogout = () => {
    localStorage.removeItem("kanthastSchoolAdminToken");
    localStorage.removeItem("kanthastSchoolAdminUser");
    toast.info("Logged out");
    navigate("/adminlogin");
  };

  const subscribedUsers = users.filter((u) => u.subscriptionPurchased);

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: subscribedUsers.length,
  };

  return (
    <div className="min-h-screen bg-surface-sunken px-3 md:px-6 py-5">
      <div className="max-w-[1500px] mx-auto">
        <div className="rounded-3xl border border-line bg-surface shadow-e4 overflow-hidden">
          <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Kanthast School</p>
              <h1 className="text-2xl md:text-3xl font-black">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                {adminUser?.firstName || "Admin"}
              </span>
              <Button type="button" variant="danger" onClick={onLogout}>
                <FaSignOutAlt aria-hidden="true" />
                Logout
              </Button>
            </div>
          </header>

          <nav className="px-4 py-3 border-b border-line bg-surface flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`px-4 py-2 min-h-touch rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-surface-sunken text-ink-muted hover:bg-line"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="p-4 md:p-6 min-h-[70vh]">
            <AnimatePresence mode="wait">
              <Motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                {activeTab === "overview" && (
                  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.totalUsers} />
                    <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
                  </div>
                )}

                {activeTab === "users" && (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-2xl font-black text-ink">Users Management</h2>
                      <Field
                        label="Search users"
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, role..."
                        containerClassName="w-full md:w-96"
                      />
                    </div>
                    {loading ? (
                      <p role="status" className="text-ink-muted">
                        Loading users...
                      </p>
                    ) : usersError ? (
                      <EmptyState
                        variant="error"
                        icon={FaUsers}
                        title="Could not load users"
                        description={usersError}
                        action="Try again"
                        onAction={loadUsers}
                      />
                    ) : filteredUsers.length === 0 ? (
                      <EmptyState
                        icon={FaUsers}
                        title={search.trim() ? "No users match that search" : "No users yet"}
                        description={
                          search.trim()
                            ? `Nothing matched "${search.trim()}". Try a different name, email or role.`
                            : "Registered students, instructors and admins will appear here once they sign up."
                        }
                        action={search.trim() ? "Clear search" : undefined}
                        onAction={search.trim() ? () => setSearch("") : undefined}
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredUsers.map((user) => {
                          const editing = editUserId === user._id;
                          return (
                            <article
                              key={user._id}
                              className="card p-4 shadow-e3"
                            >
                              {editing ? (
                                <div className="space-y-2">
                                  <Field
                                    label="First name"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                                    placeholder="First Name"
                                  />
                                  <Field
                                    label="Last name"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                                    placeholder="Last Name"
                                  />
                                  <Field
                                    label="Email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                    placeholder="Email"
                                  />
                                  <Field
                                    label="Phone"
                                    type="tel"
                                    inputMode="tel"
                                    value={editForm.contactNumber}
                                    onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))}
                                    placeholder="Phone"
                                  />
                                  <Select
                                    label="Account type"
                                    value={editForm.accountType}
                                    onChange={(value) => setEditForm((p) => ({ ...p, accountType: value }))}
                                    options={["Student", "Instructor", "Admin"]}
                                  />
                                  <Toggle
                                    label="Subscription Purchased"
                                    checked={Boolean(editForm.subscriptionPurchased)}
                                    onChange={(checked) =>
                                      setEditForm((p) => ({
                                        ...p,
                                        subscriptionPurchased: checked,
                                      }))
                                    }
                                  />
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      type="button"
                                      onClick={() => onSave(user._id)}
                                      loading={saving}
                                      loadingText="Saving..."
                                      className="flex-1"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => setEditUserId("")}
                                      disabled={saving}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-lg font-bold text-ink">
                                    {user.firstName} {user.lastName}
                                  </h3>
                                  <p className="text-sm text-ink-muted">{user.email}</p>
                                  <p className="text-sm text-ink-muted mt-1">Role: {user.accountType}</p>
                                  <p className="text-sm text-ink-muted">Phone: {user.contactNumber || "-"}</p>
                                  <p className="text-sm text-ink-muted mt-1">
                                    Subscription: {user.subscriptionPurchased ? "Active" : "Inactive"}
                                  </p>
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={() => onEdit(user)}
                                      className="flex-1"
                                    >
                                      <FaEdit aria-hidden="true" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      onClick={() => onDelete(user)}
                                      className="flex-1"
                                    >
                                      <FaTrash aria-hidden="true" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-black text-ink">Subscription Monitor</h2>
                    {loading ? (
                      <p role="status" className="text-ink-muted">
                        Loading users...
                      </p>
                    ) : usersError ? (
                      <EmptyState
                        variant="error"
                        icon={FaCrown}
                        title="Could not load subscriptions"
                        description={usersError}
                        action="Try again"
                        onAction={loadUsers}
                      />
                    ) : subscribedUsers.length === 0 ? (
                      <EmptyState
                        icon={FaCrown}
                        title="No active subscriptions"
                        description="Once a user purchases a subscription, their plan and expiry date will be listed here."
                      />
                    ) : (
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {subscribedUsers.map((u) => (
                          <div key={u._id} className="rounded-2xl border border-positive/30 bg-positive-soft p-4">
                            <p className="font-bold text-ink">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-sm text-ink-muted">{u.email}</p>
                            <p className="text-xs mt-1 text-ink-muted">
                              Valid till: {u.subscriptionValidTill ? new Date(u.subscriptionValidTill).toLocaleDateString("en-IN") : "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <LiveRegion message={statusMessage} />

      <Modal
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.title}
        description={pendingAction?.description}
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const action = pendingAction;
                setPendingAction(null);
                action?.run?.();
              }}
            >
              {pendingAction?.confirmLabel || "Confirm"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-muted">{pendingAction?.body}</p>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4 shadow-e3">
      <p className="text-sm text-ink-subtle">{label}</p>
      <p className="text-3xl font-black text-ink mt-1">{value}</p>
    </div>
  );
}