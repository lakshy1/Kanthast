import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBookMedical,
  FaChartLine,
  FaCrown,
  FaEdit,
  FaSignOutAlt,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  deleteAdminUser,
  getAdminUsers,
  getMedicineUsmleContent,
  updateAdminUser,
  updateMedicineUsmleContent,
} from "../utils/authApi";

const tabs = [
  { id: "overview", label: "Overview", icon: <FaChartLine /> },
  { id: "users", label: "Users", icon: <FaUsers /> },
  { id: "videos", label: "Videos", icon: <FaBookMedical /> },
  { id: "subscriptions", label: "Subscriptions", icon: <FaCrown /> },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem("kanthastAdminToken");
  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastAdminUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentSaving, setContentSaving] = useState(false);
  const [courseContent, setCourseContent] = useState(null);
  const [contentDraft, setContentDraft] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }
    loadUsers();
    loadCourseContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminUsers(token);
      setUsers(data.users || []);
    } catch (error) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadCourseContent = async () => {
    setContentLoading(true);
    try {
      const data = await getMedicineUsmleContent();
      const content = data.content || null;
      setCourseContent(content);
      setContentDraft(content ? JSON.stringify(content, null, 2) : "");
    } catch (error) {
      toast.error(error.message || "Failed to load course content");
    } finally {
      setContentLoading(false);
    }
  };

  const saveCourseContent = async () => {
    if (!token) return;
    setContentSaving(true);
    try {
      const payload = JSON.parse(contentDraft || "{}");
      const data = await updateMedicineUsmleContent(token, payload);
      setCourseContent(data.content || null);
      setContentDraft(data.content ? JSON.stringify(data.content, null, 2) : "");
      toast.success("Medicine/USMLE content updated");
    } catch (error) {
      const message = error instanceof SyntaxError ? "Invalid JSON format" : error.message;
      toast.error(message || "Failed to update content");
    } finally {
      setContentSaving(false);
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
      toast.success("User updated");
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (userId) => {
    if (!token) return;
    const confirmed = window.confirm("Delete this user permanently?");
    if (!confirmed) return;
    try {
      await deleteAdminUser(token, userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User deleted");
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const onLogout = () => {
    localStorage.removeItem("kanthastAdminToken");
    localStorage.removeItem("kanthastAdminUser");
    toast.info("Logged out");
    navigate("/adminlogin");
  };

  const subjects = (courseContent?.subjects || []).map((subject) => {
    const chapters = subject.chapters || [];
    const totalVideos = chapters.reduce((acc, chapter) => acc + (chapter.videos?.length || 0), 0);
    return {
      id: subject._id,
      name: subject.name,
      totalDuration: subject.totalDuration || "--:--",
      chapters,
      totalVideos,
    };
  });

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: users.filter((u) => u.subscriptionPurchased).length,
    totalSubjects: subjects.length,
    totalVideos: subjects.reduce((acc, s) => acc + s.totalVideos, 0),
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#eef2ff_42%,_#f8fafc)] px-3 md:px-6 py-5">
      <div className="max-w-[1500px] mx-auto">
        <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.10)] overflow-hidden">
          <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Kanthast</p>
              <h1 className="text-2xl md:text-3xl font-black">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                {adminUser?.firstName || "Admin"}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3.5 py-2 text-sm font-semibold hover:bg-red-600"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </header>

          <nav className="px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="p-4 md:p-6 min-h-[70vh]">
            <AnimatePresence mode="wait">
              <motion.div
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
                    <StatCard label="Subjects" value={stats.totalSubjects} />
                    <StatCard label="Total Videos" value={stats.totalVideos} />
                  </div>
                )}

                {activeTab === "users" && (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-2xl font-black text-slate-900">Users Management</h2>
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, role..."
                        className="w-full md:w-96 rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    {loading ? (
                      <p className="text-slate-600">Loading users...</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredUsers.map((user) => {
                          const editing = editUserId === user._id;
                          return (
                            <article
                              key={user._id}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
                            >
                              {editing ? (
                                <div className="space-y-2">
                                  <input
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2"
                                    placeholder="First Name"
                                  />
                                  <input
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2"
                                    placeholder="Last Name"
                                  />
                                  <input
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2"
                                    placeholder="Email"
                                  />
                                  <input
                                    value={editForm.contactNumber}
                                    onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2"
                                    placeholder="Phone"
                                  />
                                  <select
                                    value={editForm.accountType}
                                    onChange={(e) => setEditForm((p) => ({ ...p, accountType: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2"
                                  >
                                    <option value="Student">Student</option>
                                    <option value="Instructor">Instructor</option>
                                    <option value="Admin">Admin</option>
                                  </select>
                                  <label className="text-sm flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(editForm.subscriptionPurchased)}
                                      onChange={(e) =>
                                        setEditForm((p) => ({
                                          ...p,
                                          subscriptionPurchased: e.target.checked,
                                        }))
                                      }
                                    />
                                    Subscription Purchased
                                  </label>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => onSave(user._id)}
                                      disabled={saving}
                                      className="flex-1 rounded-lg bg-slate-900 text-white py-2 text-sm font-semibold"
                                    >
                                      {saving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={() => setEditUserId("")}
                                      className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900">
                                    {user.firstName} {user.lastName}
                                  </h3>
                                  <p className="text-sm text-slate-600">{user.email}</p>
                                  <p className="text-sm text-slate-600 mt-1">Role: {user.accountType}</p>
                                  <p className="text-sm text-slate-600">Phone: {user.contactNumber || "-"}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    Subscription: {user.subscriptionPurchased ? "Active" : "Inactive"}
                                  </p>
                                  <div className="flex gap-2 mt-4">
                                    <button
                                      onClick={() => onEdit(user)}
                                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-sm font-semibold hover:bg-slate-50"
                                    >
                                      <FaEdit />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => onDelete(user._id)}
                                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 text-white py-2 text-sm font-semibold hover:bg-red-600"
                                    >
                                      <FaTrash />
                                      Delete
                                    </button>
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

                {activeTab === "videos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-slate-900">Medicine/USMLE Content Manager</h2>
                      <button
                        type="button"
                        onClick={saveCourseContent}
                        disabled={contentSaving}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                      >
                        {contentSaving ? "Saving..." : "Save Course Content"}
                      </button>
                    </div>

                    {contentLoading ? (
                      <p className="text-slate-600">Loading course content...</p>
                    ) : (
                      <>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {subjects.map((subject) => (
                            <article key={subject.id || subject.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <h3 className="text-xl font-bold text-slate-900">
                                {subject.name} ({subject.totalDuration})
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                Chapters: {subject.chapters.length} | Videos: {subject.totalVideos}
                              </p>
                            </article>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-600 mb-2">
                            Edit full nested content here: subjects, chapters, videos, summary, videoLink, and photos.
                          </p>
                          <textarea
                            value={contentDraft}
                            onChange={(e) => setContentDraft(e.target.value)}
                            spellCheck={false}
                            className="w-full min-h-[420px] rounded-xl border border-slate-300 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-black text-slate-900">Subscription Monitor</h2>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {users
                        .filter((u) => u.subscriptionPurchased)
                        .map((u) => (
                          <div key={u._id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="font-bold text-slate-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-sm text-slate-700">{u.email}</p>
                            <p className="text-xs mt-1 text-slate-600">
                              Valid till: {u.subscriptionValidTill ? new Date(u.subscriptionValidTill).toLocaleDateString("en-IN") : "-"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}
