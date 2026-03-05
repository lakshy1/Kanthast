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
  createMedicineChapter,
  createMedicineSubject,
  createMedicineVideo,
  deleteMedicineChapter,
  deleteMedicineSubject,
  deleteMedicineVideo,
  deleteAdminUser,
  getAdminUsers,
  getMedicineUsmleContent,
  updateMedicineChapter,
  updateMedicineSubject,
  updateMedicineVideo,
  updateAdminUser,
  updateMedicineUsmleContent,
} from "../utils/authApi";
import { modules as legacyModules } from "./Lists";

const tabs = [
  { id: "overview", label: "Overview", icon: <FaChartLine /> },
  { id: "users", label: "Users", icon: <FaUsers /> },
  { id: "videos", label: "Videos", icon: <FaBookMedical /> },
  { id: "subscriptions", label: "Subscriptions", icon: <FaCrown /> },
];

const buildSeedPayloadFromLegacyModules = () => {
  const subjects = Object.entries(legacyModules).map(([subjectName, subjectMeta], subjectIndex) => ({
    name: subjectName,
    totalDuration: subjectMeta.totalDuration || "--:--",
    order: subjectIndex,
    chapters: (subjectMeta.sections || []).map((chapter, chapterIndex) => ({
      name: chapter.title || `Chapter ${chapterIndex + 1}`,
      totalDuration: chapter.total || "--:--",
      order: chapterIndex,
      videos: (chapter.lectures || []).map((lecture, videoIndex) => ({
        name: lecture.title || `Video ${videoIndex + 1}`,
        duration: lecture.duration || "--:--",
        summary: lecture.summary || "",
        videoLink: lecture.videoLink || "",
        photos: Array.isArray(lecture.photos) ? lecture.photos : [],
        order: videoIndex,
      })),
    })),
  }));

  return {
    courseTitle: "Medicine/USMLE",
    subjects,
  };
};

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
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [subjectForm, setSubjectForm] = useState({ name: "", totalDuration: "" });
  const [chapterForm, setChapterForm] = useState({ name: "", totalDuration: "" });
  const [videoForm, setVideoForm] = useState({
    name: "",
    duration: "",
    summary: "",
    videoLink: "",
    photosText: "[]",
  });

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }
    loadUsers();
    loadCourseContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const syncCourseState = (content) => {
    const nextContent = content || null;
    setCourseContent(nextContent);
    setContentDraft(nextContent ? JSON.stringify(nextContent, null, 2) : "");

    const firstSubject = nextContent?.subjects?.[0];
    const nextSubjectId = firstSubject?._id || "";
    const firstChapter = firstSubject?.chapters?.[0];
    const nextChapterId = firstChapter?._id || "";
    const firstVideo = firstChapter?.videos?.[0];
    const nextVideoId = firstVideo?._id || "";

    setSelectedSubjectId((prev) => prev || nextSubjectId);
    setSelectedChapterId((prev) => prev || nextChapterId);
    setSelectedVideoId((prev) => prev || nextVideoId);
  };

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
      syncCourseState(content);
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
      syncCourseState(data.content || null);
      toast.success("Medicine/USMLE content updated");
    } catch (error) {
      const message = error instanceof SyntaxError ? "Invalid JSON format" : error.message;
      toast.error(message || "Failed to update content");
    } finally {
      setContentSaving(false);
    }
  };

  const seedCourseContentFromLegacy = async () => {
    if (!token) return;
    const confirmed = window.confirm(
      "Seed full Medicine/USMLE catalog from existing legacy Lists data? This will overwrite current DB content."
    );
    if (!confirmed) return;

    setContentSaving(true);
    try {
      const payload = buildSeedPayloadFromLegacyModules();
      const data = await updateMedicineUsmleContent(token, payload);
      syncCourseState(data.content || null);
      toast.success("Medicine/USMLE data seeded to database");
    } catch (error) {
      toast.error(error.message || "Failed to seed course content");
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

  const handleCreateSubject = async () => {
    if (!token) return;
    if (!subjectForm.name.trim()) return toast.error("Subject name is required");
    setContentSaving(true);
    try {
      const data = await createMedicineSubject(token, subjectForm);
      syncCourseState(data.content || null);
      setSelectedSubjectId(data.content?.subjects?.at(-1)?._id || "");
      toast.success("Subject created");
    } catch (error) {
      toast.error(error.message || "Failed to create subject");
    } finally {
      setContentSaving(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!token || !selectedSubject?.id) return;
    setContentSaving(true);
    try {
      const data = await updateMedicineSubject(token, selectedSubject.id, subjectForm);
      syncCourseState(data.content || null);
      toast.success("Subject updated");
    } catch (error) {
      toast.error(error.message || "Failed to update subject");
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!token || !selectedSubject?.id) return;
    if (!window.confirm(`Delete subject "${selectedSubject.name}" and all nested data?`)) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineSubject(token, selectedSubject.id);
      syncCourseState(data.content || null);
      toast.success("Subject deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete subject");
    } finally {
      setContentSaving(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!token || !selectedSubject?.id) return toast.error("Select a subject first");
    if (!chapterForm.name.trim()) return toast.error("Chapter name is required");
    setContentSaving(true);
    try {
      const data = await createMedicineChapter(token, selectedSubject.id, chapterForm);
      syncCourseState(data.content || null);
      const refreshedSubject =
        (data.content?.subjects || []).find((s) => s._id === selectedSubject.id) || null;
      setSelectedChapterId(refreshedSubject?.chapters?.at(-1)?._id || "");
      toast.success("Chapter created");
    } catch (error) {
      toast.error(error.message || "Failed to create chapter");
    } finally {
      setContentSaving(false);
    }
  };

  const handleUpdateChapter = async () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id) return;
    setContentSaving(true);
    try {
      const data = await updateMedicineChapter(token, selectedSubject.id, selectedChapter._id, chapterForm);
      syncCourseState(data.content || null);
      toast.success("Chapter updated");
    } catch (error) {
      toast.error(error.message || "Failed to update chapter");
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id) return;
    if (!window.confirm(`Delete chapter "${selectedChapter.name}" and all videos?`)) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineChapter(token, selectedSubject.id, selectedChapter._id);
      syncCourseState(data.content || null);
      toast.success("Chapter deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete chapter");
    } finally {
      setContentSaving(false);
    }
  };

  const parsePhotos = () => {
    try {
      const parsed = JSON.parse(videoForm.photosText || "[]");
      if (!Array.isArray(parsed)) throw new Error("Photos must be an array");
      return parsed;
    } catch {
      throw new Error("Photos must be valid JSON array");
    }
  };

  const handleCreateVideo = async () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id) {
      return toast.error("Select subject and chapter first");
    }
    if (!videoForm.name.trim()) return toast.error("Video name is required");
    setContentSaving(true);
    try {
      const payload = { ...videoForm, photos: parsePhotos() };
      const data = await createMedicineVideo(token, selectedSubject.id, selectedChapter._id, payload);
      syncCourseState(data.content || null);
      const refreshedSubject =
        (data.content?.subjects || []).find((s) => s._id === selectedSubject.id) || null;
      const refreshedChapter =
        (refreshedSubject?.chapters || []).find((c) => c._id === selectedChapter._id) || null;
      setSelectedVideoId(refreshedChapter?.videos?.at(-1)?._id || "");
      toast.success("Video created");
    } catch (error) {
      toast.error(error.message || "Failed to create video");
    } finally {
      setContentSaving(false);
    }
  };

  const handleUpdateVideo = async () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id || !selectedVideo?._id) return;
    setContentSaving(true);
    try {
      const payload = { ...videoForm, photos: parsePhotos() };
      const data = await updateMedicineVideo(
        token,
        selectedSubject.id,
        selectedChapter._id,
        selectedVideo._id,
        payload
      );
      syncCourseState(data.content || null);
      toast.success("Video updated");
    } catch (error) {
      toast.error(error.message || "Failed to update video");
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id || !selectedVideo?._id) return;
    if (!window.confirm(`Delete video "${selectedVideo.name}"?`)) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineVideo(
        token,
        selectedSubject.id,
        selectedChapter._id,
        selectedVideo._id
      );
      syncCourseState(data.content || null);
      toast.success("Video deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete video");
    } finally {
      setContentSaving(false);
    }
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

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  const chapters = selectedSubject?.chapters || [];
  const selectedChapter = chapters.find((c) => c._id === selectedChapterId) || chapters[0] || null;
  const videos = selectedChapter?.videos || [];
  const selectedVideo = videos.find((v) => v._id === selectedVideoId) || videos[0] || null;

  useEffect(() => {
    const nextSubjectId = selectedSubject?.id || "";
    if (selectedSubjectId !== nextSubjectId) {
      setSelectedSubjectId(nextSubjectId);
    }
    const nextChapterId = selectedChapter?._id || "";
    if (selectedChapterId !== nextChapterId) {
      setSelectedChapterId(nextChapterId);
    }
    const nextVideoId = selectedVideo?._id || "";
    if (selectedVideoId !== nextVideoId) {
      setSelectedVideoId(nextVideoId);
    }
  }, [selectedSubject, selectedChapter, selectedVideo, selectedSubjectId, selectedChapterId, selectedVideoId]);

  useEffect(() => {
    setSubjectForm({
      name: selectedSubject?.name || "",
      totalDuration: selectedSubject?.totalDuration || "",
    });
  }, [selectedSubject?.id]);

  useEffect(() => {
    setChapterForm({
      name: selectedChapter?.name || "",
      totalDuration: selectedChapter?.totalDuration || "",
    });
  }, [selectedChapter?._id]);

  useEffect(() => {
    setVideoForm({
      name: selectedVideo?.name || "",
      duration: selectedVideo?.duration || "",
      summary: selectedVideo?.summary || "",
      videoLink: selectedVideo?.videoLink || "",
      photosText: JSON.stringify(selectedVideo?.photos || [], null, 2),
    });
  }, [selectedVideo?._id]);

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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={seedCourseContentFromLegacy}
                          disabled={contentSaving}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-70"
                        >
                          {contentSaving ? "Working..." : "Seed Legacy Data to DB"}
                        </button>
                        <button
                          type="button"
                          onClick={saveCourseContent}
                          disabled={contentSaving}
                          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                        >
                          {contentSaving ? "Saving..." : "Save Course Content"}
                        </button>
                      </div>
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

                        <div className="grid xl:grid-cols-3 gap-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                            <p className="text-sm font-bold text-slate-900">Subject CRUD</p>
                            <select
                              value={selectedSubject?.id || ""}
                              onChange={(e) => setSelectedSubjectId(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                              {(subjects || []).map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <input
                              value={subjectForm.name}
                              onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Subject name"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <input
                              value={subjectForm.totalDuration}
                              onChange={(e) => setSubjectForm((p) => ({ ...p, totalDuration: e.target.value }))}
                              placeholder="Total duration (e.g. 26:25:15)"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={handleCreateSubject} className="rounded-lg bg-slate-900 text-white py-2 text-sm">Create</button>
                              <button onClick={handleUpdateSubject} className="rounded-lg border border-slate-300 py-2 text-sm">Update</button>
                              <button onClick={handleDeleteSubject} className="rounded-lg bg-red-500 text-white py-2 text-sm">Delete</button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                            <p className="text-sm font-bold text-slate-900">Chapter CRUD</p>
                            <select
                              value={selectedChapter?._id || ""}
                              onChange={(e) => setSelectedChapterId(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                              {(chapters || []).map((item) => (
                                <option key={item._id} value={item._id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <input
                              value={chapterForm.name}
                              onChange={(e) => setChapterForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Chapter name"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <input
                              value={chapterForm.totalDuration}
                              onChange={(e) => setChapterForm((p) => ({ ...p, totalDuration: e.target.value }))}
                              placeholder="Total duration"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={handleCreateChapter} className="rounded-lg bg-slate-900 text-white py-2 text-sm">Create</button>
                              <button onClick={handleUpdateChapter} className="rounded-lg border border-slate-300 py-2 text-sm">Update</button>
                              <button onClick={handleDeleteChapter} className="rounded-lg bg-red-500 text-white py-2 text-sm">Delete</button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                            <p className="text-sm font-bold text-slate-900">Video CRUD</p>
                            <select
                              value={selectedVideo?._id || ""}
                              onChange={(e) => setSelectedVideoId(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                              {(videos || []).map((item) => (
                                <option key={item._id} value={item._id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <input
                              value={videoForm.name}
                              onChange={(e) => setVideoForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Video name"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <input
                              value={videoForm.duration}
                              onChange={(e) => setVideoForm((p) => ({ ...p, duration: e.target.value }))}
                              placeholder="Duration (e.g. 07:19)"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <input
                              value={videoForm.videoLink}
                              onChange={(e) => setVideoForm((p) => ({ ...p, videoLink: e.target.value }))}
                              placeholder="Video link"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <textarea
                              value={videoForm.summary}
                              onChange={(e) => setVideoForm((p) => ({ ...p, summary: e.target.value }))}
                              placeholder="Summary"
                              className="w-full min-h-[90px] rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <textarea
                              value={videoForm.photosText}
                              onChange={(e) => setVideoForm((p) => ({ ...p, photosText: e.target.value }))}
                              placeholder='Photos JSON array: [{"imageLink":"...","imageText":"..."}]'
                              className="w-full min-h-[90px] rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={handleCreateVideo} className="rounded-lg bg-slate-900 text-white py-2 text-sm">Create</button>
                              <button onClick={handleUpdateVideo} className="rounded-lg border border-slate-300 py-2 text-sm">Update</button>
                              <button onClick={handleDeleteVideo} className="rounded-lg bg-red-500 text-white py-2 text-sm">Delete</button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm text-slate-600 mb-2">Raw JSON editor (advanced full-replace mode)</p>
                          <textarea
                            value={contentDraft}
                            onChange={(e) => setContentDraft(e.target.value)}
                            spellCheck={false}
                            className="w-full min-h-[260px] rounded-xl border border-slate-300 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-cyan-400"
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
