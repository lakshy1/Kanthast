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
import { modules as legacyModules } from "../data/modulesSeedData";
import { Button, EmptyState, Field, LiveRegion, Modal, Select, Toggle } from "../components/ui";

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
  const [usersError, setUsersError] = useState("");
  const [contentError, setContentError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  // What a destructive action is waiting on confirmation for. Shape:
  // { title, description, body, confirmLabel, run }
  const [pendingAction, setPendingAction] = useState(null);
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

  const loadCourseContent = async () => {
    setContentLoading(true);
    setContentError("");
    try {
      const data = await getMedicineUsmleContent();
      const content = data.content || null;
      syncCourseState(content);
    } catch (error) {
      const message = error.message || "Failed to load course content";
      setContentError(message);
      setStatusMessage(message);
      toast.error(message);
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
      setStatusMessage("Medicine/USMLE content updated");
      toast.success("Medicine/USMLE content updated");
    } catch (error) {
      const message = error instanceof SyntaxError ? "Invalid JSON format" : error.message;
      setStatusMessage(message || "Failed to update content");
      toast.error(message || "Failed to update content");
    } finally {
      setContentSaving(false);
    }
  };

  const runSeedCourseContentFromLegacy = async () => {
    if (!token) return;
    setContentSaving(true);
    try {
      const payload = buildSeedPayloadFromLegacyModules();
      const data = await updateMedicineUsmleContent(token, payload);
      syncCourseState(data.content || null);
      setStatusMessage("Medicine/USMLE data seeded to database");
      toast.success("Medicine/USMLE data seeded to database");
    } catch (error) {
      const message = error.message || "Failed to seed course content";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const seedCourseContentFromLegacy = () => {
    if (!token) return;
    const seedPreview = buildSeedPayloadFromLegacyModules();
    const seedSubjectCount = seedPreview.subjects.length;
    setPendingAction({
      title: "Replace the entire Medicine/USMLE catalog?",
      description:
        "This overwrites the whole course in the database with the legacy Lists seed data. It cannot be undone.",
      body: `Every subject, chapter and video currently stored for Medicine/USMLE (${subjects.length} subject${
        subjects.length === 1 ? "" : "s"
      }, ${stats.totalVideos} video${
        stats.totalVideos === 1 ? "" : "s"
      }) will be deleted and replaced by the ${seedSubjectCount} subject${
        seedSubjectCount === 1 ? "" : "s"
      } from the legacy Lists seed file. Any edits made in this panel since the last seed will be lost.`,
      confirmLabel: "Overwrite catalog with seed data",
      run: runSeedCourseContentFromLegacy,
    });
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
      setStatusMessage("Subject created");
      toast.success("Subject created");
    } catch (error) {
      const message = error.message || "Failed to create subject";
      setStatusMessage(message);
      toast.error(message);
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
      setStatusMessage("Subject updated");
      toast.success("Subject updated");
    } catch (error) {
      const message = error.message || "Failed to update subject";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const runDeleteSubject = async (subject) => {
    if (!token || !subject?.id) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineSubject(token, subject.id);
      syncCourseState(data.content || null);
      setStatusMessage("Subject deleted");
      toast.success("Subject deleted");
    } catch (error) {
      const message = error.message || "Failed to delete subject";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteSubject = () => {
    if (!token || !selectedSubject?.id) return;
    const subject = selectedSubject;
    setPendingAction({
      title: `Delete the subject "${subject.name}"?`,
      description: "Every chapter and video inside it is deleted too. This cannot be undone.",
      body: `"${subject.name}" currently holds ${subject.chapters.length} chapter${
        subject.chapters.length === 1 ? "" : "s"
      } and ${subject.totalVideos} video${
        subject.totalVideos === 1 ? "" : "s"
      }. All of them will be removed from the Medicine/USMLE catalog.`,
      confirmLabel: "Delete subject",
      run: () => runDeleteSubject(subject),
    });
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
      setStatusMessage("Chapter created");
      toast.success("Chapter created");
    } catch (error) {
      const message = error.message || "Failed to create chapter";
      setStatusMessage(message);
      toast.error(message);
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
      setStatusMessage("Chapter updated");
      toast.success("Chapter updated");
    } catch (error) {
      const message = error.message || "Failed to update chapter";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const runDeleteChapter = async (subject, chapter) => {
    if (!token || !subject?.id || !chapter?._id) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineChapter(token, subject.id, chapter._id);
      syncCourseState(data.content || null);
      setStatusMessage("Chapter deleted");
      toast.success("Chapter deleted");
    } catch (error) {
      const message = error.message || "Failed to delete chapter";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteChapter = () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id) return;
    const subject = selectedSubject;
    const chapter = selectedChapter;
    const videoCount = chapter.videos?.length || 0;
    setPendingAction({
      title: `Delete the chapter "${chapter.name}"?`,
      description: "Every video inside it is deleted too. This cannot be undone.",
      body: `"${chapter.name}" and its ${videoCount} video${
        videoCount === 1 ? "" : "s"
      } will be removed from "${subject.name}".`,
      confirmLabel: "Delete chapter",
      run: () => runDeleteChapter(subject, chapter),
    });
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
      setStatusMessage("Video created");
      toast.success("Video created");
    } catch (error) {
      const message = error.message || "Failed to create video";
      setStatusMessage(message);
      toast.error(message);
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
      setStatusMessage("Video updated");
      toast.success("Video updated");
    } catch (error) {
      const message = error.message || "Failed to update video";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const runDeleteVideo = async (subject, chapter, video) => {
    if (!token || !subject?.id || !chapter?._id || !video?._id) return;
    setContentSaving(true);
    try {
      const data = await deleteMedicineVideo(token, subject.id, chapter._id, video._id);
      syncCourseState(data.content || null);
      setStatusMessage("Video deleted");
      toast.success("Video deleted");
    } catch (error) {
      const message = error.message || "Failed to delete video";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setContentSaving(false);
    }
  };

  const handleDeleteVideo = () => {
    if (!token || !selectedSubject?.id || !selectedChapter?._id || !selectedVideo?._id) return;
    const subject = selectedSubject;
    const chapter = selectedChapter;
    const video = selectedVideo;
    setPendingAction({
      title: `Delete the video "${video.name}"?`,
      description: "This removes the lecture from the catalog and cannot be undone.",
      body: `"${video.name}" will be removed from "${chapter.name}" in "${subject.name}", along with its summary and photo list.`,
      confirmLabel: "Delete video",
      run: () => runDeleteVideo(subject, chapter, video),
    });
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
    <div className="min-h-screen bg-surface-sunken px-3 md:px-6 py-5">
      <div className="max-w-[1500px] mx-auto">
        <div className="rounded-3xl border border-line bg-surface shadow-e4 overflow-hidden">
          <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Kanthast</p>
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

                {activeTab === "videos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-ink">Medicine/USMLE Content Manager</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={seedCourseContentFromLegacy}
                          loading={contentSaving}
                          loadingText="Working..."
                        >
                          Seed Legacy Data to DB
                        </Button>
                        <Button
                          type="button"
                          onClick={saveCourseContent}
                          loading={contentSaving}
                          loadingText="Saving..."
                        >
                          Save Course Content
                        </Button>
                      </div>
                    </div>

                    {contentLoading ? (
                      <p role="status" className="text-ink-muted">
                        Loading course content...
                      </p>
                    ) : contentError ? (
                      <EmptyState
                        variant="error"
                        icon={FaBookMedical}
                        title="Could not load course content"
                        description={contentError}
                        action="Try again"
                        onAction={loadCourseContent}
                      />
                    ) : (
                      <>
                        {subjects.length === 0 ? (
                          <EmptyState
                            icon={FaBookMedical}
                            title="No subjects in the catalog yet"
                            description="Create a subject below, or seed the whole Medicine/USMLE catalog from the legacy Lists data."
                          />
                        ) : (
                          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {subjects.map((subject) => (
                              <article key={subject.id || subject.name} className="card p-4">
                                <h3 className="text-xl font-bold text-ink">
                                  {subject.name} ({subject.totalDuration})
                                </h3>
                                <p className="text-sm text-ink-muted mt-1">
                                  Chapters: {subject.chapters.length} | Videos: {subject.totalVideos}
                                </p>
                              </article>
                            ))}
                          </div>
                        )}

                        <div className="grid xl:grid-cols-3 gap-4">
                          <div className="card p-4 space-y-3">
                            <h3 className="text-sm font-bold text-ink">Subject CRUD</h3>
                            <Select
                              label="Selected subject"
                              value={selectedSubject?.id || ""}
                              onChange={(value) => setSelectedSubjectId(value)}
                              options={(subjects || []).map((item) => ({
                                value: item.id,
                                label: item.name,
                              }))}
                              placeholder="No subjects yet"
                            />
                            <Field
                              label="Subject name"
                              value={subjectForm.name}
                              onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Subject name"
                            />
                            <Field
                              label="Total duration"
                              value={subjectForm.totalDuration}
                              onChange={(e) => setSubjectForm((p) => ({ ...p, totalDuration: e.target.value }))}
                              placeholder="Total duration (e.g. 26:25:15)"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Button type="button" onClick={handleCreateSubject} disabled={contentSaving}>
                                Create
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={handleUpdateSubject}
                                disabled={contentSaving}
                              >
                                Update
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteSubject}
                                disabled={contentSaving}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="card p-4 space-y-3">
                            <h3 className="text-sm font-bold text-ink">Chapter CRUD</h3>
                            <Select
                              label="Selected chapter"
                              value={selectedChapter?._id || ""}
                              onChange={(value) => setSelectedChapterId(value)}
                              options={(chapters || []).map((item) => ({
                                value: item._id,
                                label: item.name,
                              }))}
                              placeholder="No chapters yet"
                            />
                            <Field
                              label="Chapter name"
                              value={chapterForm.name}
                              onChange={(e) => setChapterForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Chapter name"
                            />
                            <Field
                              label="Total duration"
                              value={chapterForm.totalDuration}
                              onChange={(e) => setChapterForm((p) => ({ ...p, totalDuration: e.target.value }))}
                              placeholder="Total duration"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Button type="button" onClick={handleCreateChapter} disabled={contentSaving}>
                                Create
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={handleUpdateChapter}
                                disabled={contentSaving}
                              >
                                Update
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteChapter}
                                disabled={contentSaving}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="card p-4 space-y-3">
                            <p className="text-sm font-bold text-ink">Video CRUD</p>
                            <select
                              value={selectedVideo?._id || ""}
                              onChange={(e) => setSelectedVideoId(e.target.value)}
                              className="w-full rounded-lg border border-line px-3 py-2"
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
                              className="w-full rounded-lg border border-line px-3 py-2"
                            />
                            <input
                              value={videoForm.duration}
                              onChange={(e) => setVideoForm((p) => ({ ...p, duration: e.target.value }))}
                              placeholder="Duration (e.g. 07:19)"
                              className="w-full rounded-lg border border-line px-3 py-2"
                            />
                            <input
                              value={videoForm.videoLink}
                              onChange={(e) => setVideoForm((p) => ({ ...p, videoLink: e.target.value }))}
                              placeholder="Video link"
                              className="w-full rounded-lg border border-line px-3 py-2"
                            />
                            <textarea
                              value={videoForm.summary}
                              onChange={(e) => setVideoForm((p) => ({ ...p, summary: e.target.value }))}
                              placeholder="Summary"
                              className="w-full min-h-[90px] rounded-lg border border-line px-3 py-2"
                            />
                            <textarea
                              value={videoForm.photosText}
                              onChange={(e) => setVideoForm((p) => ({ ...p, photosText: e.target.value }))}
                              placeholder='Photos JSON array: [{"imageLink":"...","imageText":"..."}]'
                              className="w-full min-h-[90px] rounded-lg border border-line px-3 py-2 font-mono text-xs"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={handleCreateVideo} className="rounded-lg bg-slate-900 text-white py-2 text-sm">Create</button>
                              <button onClick={handleUpdateVideo} className="rounded-lg border border-line py-2 text-sm">Update</button>
                              <button onClick={handleDeleteVideo} className="rounded-lg bg-red-500 text-white py-2 text-sm">Delete</button>
                            </div>
                          </div>
                        </div>

                        <div className="card p-4">
                          <p className="text-sm text-ink-muted mb-2">Raw JSON editor (advanced full-replace mode)</p>
                          <textarea
                            value={contentDraft}
                            onChange={(e) => setContentDraft(e.target.value)}
                            spellCheck={false}
                            className="w-full min-h-[260px] rounded-xl border border-line p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-black text-ink">Subscription Monitor</h2>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {users
                        .filter((u) => u.subscriptionPurchased)
                        .map((u) => (
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
                  </div>
                )}
              </motion.div>
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
