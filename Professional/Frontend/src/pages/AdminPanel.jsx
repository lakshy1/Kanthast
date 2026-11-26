import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  FaBookMedical,
  FaChartLine,
  FaCrown,
  FaDownload,
  FaEdit,
  FaHistory,
  FaSearch,
  FaSignOutAlt,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import { FiSidebar } from "react-icons/fi";
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
  getMedicineUsmleContentAdmin,
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
  { id: "audit", label: "Audit Log", icon: <FaHistory /> },
];

const AUDIT_KEY = "kanthastProAdminAudit_v1";
function readAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
}

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
  const queryClient = useQueryClient();
  const token = localStorage.getItem("kanthastAdminToken");
  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("kanthastAdminUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [activeTab, setActiveTab] = useState("overview");
  const [contentError, setContentError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  // What a destructive action is waiting on confirmation for. Shape:
  // { title, description, body, confirmLabel, run }
  const [pendingAction, setPendingAction] = useState(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editUserId, setEditUserId] = useState("");
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [auditLogs, setAuditLogs] = useState(readAuditLog);
  const [showRawJson, setShowRawJson] = useState(false);
  const [contentEditorTab, setContentEditorTab] = useState("video"); // subject | chapter | video

  const recordAudit = useCallback((action, target, details = "") => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: adminUser?.email || adminUser?.firstName || "Admin",
      action,
      target,
      details,
    };
    setAuditLogs((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      try { localStorage.setItem(AUDIT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [adminUser]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleAuthError = useCallback((error) => {
    const msg = String(error?.message || "");
    if (error?.status === 401 || /expired|unauthorized|invalid token/i.test(msg)) {
      localStorage.removeItem("kanthastAdminToken");
      localStorage.removeItem("kanthastAdminUser");
      toast.error("Admin session expired. Please log in again.");
      navigate("/adminlogin");
      return true;
    }
    return false;
  }, [navigate]);
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
    loadCourseContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const {
    data: usersData,
    isLoading: loading,
    error: usersQueryError,
    refetch: loadUsers,
  } = useQuery({
    queryKey: ["proAdminUsers", token],
    queryFn: () => getAdminUsers(token),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);
  const usersError = usersQueryError?.message || "";

  const setUsers = useCallback(
    (updater) => {
      queryClient.setQueryData(["proAdminUsers", token], (old) => {
        const prev = old?.users || [];
        const next = typeof updater === "function" ? updater(prev) : updater;
        return { ...(old || {}), users: next };
      });
    },
    [queryClient, token]
  );

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

  const loadCourseContent = async () => {
    setContentLoading(true);
    setContentError("");
    try {
      const data = await getMedicineUsmleContentAdmin(token);
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
    return users.filter((u) => {
      if (planFilter === "active" && !u.subscriptionPurchased) return false;
      if (planFilter === "free" && u.subscriptionPurchased) return false;
      if (roleFilter !== "all" && (u.accountType || "Student") !== roleFilter) return false;
      if (query) {
        const hay = [u.firstName, u.lastName, u.email, u.accountType, u.contactNumber].join(" ").toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [users, search, planFilter, roleFilter]);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage]
  );

  const toggleSelectAllPage = () => {
    const pageIds = pagedUsers.map((u) => u._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runBulkSubscription = async (purchased) => {
    if (!token || selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const u = users.find((x) => x._id === id);
          if (!u) return Promise.resolve();
          return updateAdminUser(token, id, {
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            email: u.email || "",
            contactNumber: u.contactNumber || "",
            accountType: u.accountType || "Student",
            subscriptionPurchased: purchased,
          });
        })
      );
      setUsers((prev) =>
        prev.map((u) => (selectedIds.includes(u._id) ? { ...u, subscriptionPurchased: purchased } : u))
      );
      recordAudit("user.bulk_plan_updated", `${selectedIds.length} users`, purchased ? "Activated subscription" : "Set to Free");
      toast.success(`Updated ${selectedIds.length} users`);
      setSelectedIds([]);
    } catch (error) {
      if (handleAuthError(error)) return;
      toast.error(error.message || "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const confirmBulkDelete = () => {
    if (!token || selectedIds.length === 0) return;
    const count = selectedIds.length;
    setPendingAction({
      title: `Delete ${count} selected user${count === 1 ? "" : "s"}?`,
      description: "This permanently removes all selected accounts and cannot be undone.",
      body: `${count} user account${count === 1 ? "" : "s"} will be permanently deleted.`,
      confirmLabel: `Delete ${count} user${count === 1 ? "" : "s"}`,
      run: async () => {
        setBulkBusy(true);
        try {
          await Promise.all(selectedIds.map((id) => deleteAdminUser(token, id)));
          setUsers((prev) => prev.filter((u) => !selectedIds.includes(u._id)));
          recordAudit("user.bulk_deleted", `${count} users`);
          toast.success(`Deleted ${count} users`);
          setSelectedIds([]);
        } catch (error) {
          if (handleAuthError(error)) return;
          toast.error(error.message || "Bulk delete failed");
        } finally {
          setBulkBusy(false);
        }
      },
    });
  };

  const exportCsv = () => {
    const rows = [
      ["First Name", "Last Name", "Email", "Phone", "Role", "Subscription", "Joined"],
      ...filteredUsers.map((u) => [
        u.firstName || "",
        u.lastName || "",
        u.email || "",
        u.contactNumber || "",
        u.accountType || "Student",
        u.subscriptionPurchased ? "Active" : "Free",
        u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanthast-pro-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onEdit = (user) => {
    setEditUserId(user._id);
    setEditErrors({});
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      contactNumber: user.contactNumber || "",
      accountType: user.accountType || "Student",
      subscriptionPurchased: Boolean(user.subscriptionPurchased),
    });
  };

  const validateEditField = (field, value) => {
    if (field === "firstName" && !String(value || "").trim()) return "First name is required";
    if (field === "email") {
      const v = String(value || "").trim();
      if (!v) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
    }
    return "";
  };

  const onSave = async (userId) => {
    if (!token) return;
    const nextErrors = {
      firstName: validateEditField("firstName", editForm.firstName),
      email: validateEditField("email", editForm.email),
    };
    if (nextErrors.firstName || nextErrors.email) {
      setEditErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      const data = await updateAdminUser(token, userId, editForm);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...(data.user || {}) } : u)));
      setEditUserId("");
      recordAudit("user.updated", editForm.email || userId, `Role: ${editForm.accountType}, Plan: ${editForm.subscriptionPurchased ? "Active" : "Free"}`);
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
      setSelectedIds((prev) => prev.filter((id) => id !== userId));
      recordAudit("user.deleted", userId);
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

  const subscribedUsers = users.filter((u) => u.subscriptionPurchased);

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: subscribedUsers.length,
    totalSubjects: subjects.length,
    totalVideos: subjects.reduce((acc, s) => acc + s.totalVideos, 0),
  };

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];
  const cmdUsers = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 5);
    return users
      .filter((u) => [u.firstName, u.lastName, u.email].join(" ").toLowerCase().includes(q))
      .slice(0, 6);
  }, [users, cmdQuery]);

  const savedJsonBaseline = useMemo(
    () => (courseContent ? JSON.stringify(courseContent, null, 2) : ""),
    [courseContent]
  );
  const isJsonDirty = showRawJson && contentDraft !== savedJsonBaseline;

  return (
    <div className="min-h-screen bg-surface-sunken flex">
      {/* Persistent Collapsible Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-line bg-surface transition-all duration-200 shrink-0 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-3.5">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Kanthast</p>
              <p className="truncate text-sm font-extrabold text-ink">Pro Admin</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken hover:text-ink"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FiSidebar size={16} />
          </button>
        </div>

        <nav aria-label="Admin sections" className="flex-1 space-y-1 p-2.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "page" : undefined}
                title={sidebarCollapsed ? tab.label : undefined}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-brand-soft/70 text-brand"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <span className="shrink-0 text-sm">{tab.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line p-2.5">
          <button
            type="button"
            onClick={onLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-critical hover:bg-critical-soft transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <FaSignOutAlt aria-hidden="true" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm md:px-6">
          <h1 className="truncate text-base font-extrabold text-ink">{activeTabMeta.label}</h1>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface-sunken/70 px-2.5 text-xs text-ink-muted hover:border-line-strong hover:text-ink"
            >
              <FaSearch size={11} aria-hidden="true" />
              <span className="hidden sm:inline">Quick jump</span>
              <kbd className="hidden sm:inline rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
            </button>
            <span className="hidden sm:inline-flex items-center rounded-full border border-line bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink">
              {adminUser?.firstName || "Admin"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="md:hidden inline-flex h-8 items-center gap-1.5 rounded-lg bg-critical-soft px-2.5 text-xs font-semibold text-critical"
            >
              <FaSignOutAlt size={11} aria-hidden="true" />
              Logout
            </button>
          </div>
        </header>

        <nav className="flex gap-1.5 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeTab === tab.id ? "bg-brand text-brand-fg" : "bg-surface-sunken text-ink-muted"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 max-w-[1440px] w-full mx-auto">
            <AnimatePresence mode="wait">
              <Motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <StatCard label="Total Users" value={stats.totalUsers} />
                      <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
                      <StatCard label="Subjects" value={stats.totalSubjects} />
                      <StatCard label="Total Videos" value={stats.totalVideos} />
                    </div>

                    <div className="card overflow-hidden">
                      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                        <h2 className="text-sm font-bold text-ink">Recent Signups</h2>
                        <button type="button" onClick={() => setActiveTab("users")} className="text-xs font-semibold text-brand hover:underline">
                          View all users
                        </button>
                      </div>
                      {users.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-ink-muted">No users registered yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-sunken/60 text-xs text-ink-subtle">
                              <tr>
                                <th className="px-4 py-2.5 font-semibold">User</th>
                                <th className="px-4 py-2.5 font-semibold">Role</th>
                                <th className="px-4 py-2.5 font-semibold">Plan</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {users.slice(0, 5).map((u) => (
                                <tr key={u._id} className="hover:bg-surface-sunken/40">
                                  <td className="px-4 py-2.5">
                                    <p className="font-semibold text-ink">{u.firstName} {u.lastName}</p>
                                    <p className="text-xs text-ink-muted">{u.email}</p>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-ink-muted">{u.accountType || "Student"}</td>
                                  <td className="px-4 py-2.5 text-xs">
                                    <span className={`inline-flex items-center gap-1.5 font-medium ${u.subscriptionPurchased ? "text-positive" : "text-ink-subtle"}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${u.subscriptionPurchased ? "bg-positive" : "bg-ink-subtle/40"}`} />
                                      {u.subscriptionPurchased ? "Active" : "Free"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <button type="button" onClick={() => { onEdit(u); setActiveTab("users"); }} className="text-xs font-semibold text-brand hover:underline">
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "users" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-ink">Users Management</h2>
                        <p className="text-xs text-ink-muted tabular-nums">
                          Showing {pagedUsers.length} of {filteredUsers.length} users
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-lg border border-line bg-surface-sunken p-0.5 text-xs">
                          {[
                            { id: "all", label: "All" },
                            { id: "active", label: "Subscribed" },
                            { id: "free", label: "Free" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => { setPlanFilter(f.id); setPage(1); }}
                              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                planFilter === f.id ? "bg-surface text-ink shadow-e1" : "text-ink-muted hover:text-ink"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <select
                          aria-label="Filter by role"
                          value={roleFilter}
                          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                          className="h-9 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                        >
                          <option value="all">All roles</option>
                          <option value="Student">Student</option>
                          <option value="Instructor">Instructor</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <div className="relative w-full sm:w-64">
                          <FaSearch size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
                          <input
                            type="search"
                            aria-label="Search users"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search name, email, phone..."
                            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={exportCsv}
                          disabled={filteredUsers.length === 0}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FaDownload size={11} aria-hidden="true" />
                          <span>Export CSV</span>
                        </button>
                      </div>
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
                        title={search.trim() || planFilter !== "all" || roleFilter !== "all" ? "No users match these filters" : "No users yet"}
                        description="Try clearing your search or changing the plan/role filters."
                        action={search.trim() || planFilter !== "all" || roleFilter !== "all" ? "Reset filters" : undefined}
                        onAction={() => { setSearch(""); setPlanFilter("all"); setRoleFilter("all"); setPage(1); }}
                      />
                    ) : (
                      <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-sunken/70 text-xs text-ink-subtle">
                              <tr>
                                <th className="w-10 px-4 py-3">
                                  <input
                                    type="checkbox"
                                    aria-label="Select all users on page"
                                    checked={pagedUsers.length > 0 && pagedUsers.every((u) => selectedIds.includes(u._id))}
                                    onChange={toggleSelectAllPage}
                                    className="h-4 w-4 rounded border-line accent-brand"
                                  />
                                </th>
                                <th className="px-4 py-3 font-semibold">User</th>
                                <th className="px-4 py-3 font-semibold">Role</th>
                                <th className="px-4 py-3 font-semibold">Phone</th>
                                <th className="px-4 py-3 font-semibold">Plan</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {pagedUsers.map((user) => (
                                <tr key={user._id} className={`hover:bg-surface-sunken/35 ${selectedIds.includes(user._id) ? "bg-brand-soft/25" : ""}`}>
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${user.firstName || user.email}`}
                                      checked={selectedIds.includes(user._id)}
                                      onChange={() => toggleSelectOne(user._id)}
                                      className="h-4 w-4 rounded border-line accent-brand"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-ink-muted">
                                        {(user.firstName || user.email || "?").charAt(0).toUpperCase()}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-ink">{user.firstName} {user.lastName}</p>
                                        <p className="truncate text-xs text-ink-muted">{user.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="inline-flex rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                                      {user.accountType || "Student"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-ink-muted tabular-nums">{user.contactNumber || "—"}</td>
                                  <td className="px-4 py-2.5 text-xs">
                                    <span className={`inline-flex items-center gap-1.5 font-semibold ${user.subscriptionPurchased ? "text-positive" : "text-ink-subtle"}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${user.subscriptionPurchased ? "bg-positive" : "bg-ink-subtle/40"}`} />
                                      {user.subscriptionPurchased ? "Active" : "Free"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => onEdit(user)}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-sunken"
                                      >
                                        <FaEdit size={11} aria-hidden="true" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onDelete(user)}
                                        aria-label={`Delete ${user.firstName || user.email}`}
                                        title="Delete user"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-critical-soft hover:text-critical"
                                      >
                                        <FaTrash size={12} aria-hidden="true" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted">
                            <span className="tabular-nums">Page {safePage} of {totalPages}</span>
                            <div className="flex gap-2">
                              <Button type="button" variant="secondary" className="px-3 py-1 text-xs" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                              <Button type="button" variant="secondary" className="px-3 py-1 text-xs" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                            </div>
                          </div>
                        )}
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

                        <div className="flex items-center justify-between gap-2 pt-2">
                          <div className="inline-flex rounded-lg border border-line bg-surface-sunken p-0.5 text-xs">
                            {[
                              { id: "subject", label: "Subject" },
                              { id: "chapter", label: "Chapter" },
                              { id: "video", label: "Video" },
                            ].map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setContentEditorTab(m.id)}
                                className={`rounded-md px-3 py-1 font-semibold transition ${
                                  contentEditorTab === m.id ? "bg-surface text-ink shadow-e1" : "text-ink-muted hover:text-ink"
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => setShowRawJson((v) => !v)}
                          >
                            {showRawJson ? "Hide Advanced JSON" : "Advanced JSON"}
                          </Button>
                        </div>

                        <div className="grid xl:grid-cols-3 gap-4">
                          <div className={`card p-4 space-y-3 ${contentEditorTab !== "subject" ? "hidden xl:block" : ""}`}>
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

                          <div className={`card p-4 space-y-3 ${contentEditorTab !== "chapter" ? "hidden xl:block" : ""}`}>
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

                          <div className={`card p-4 space-y-3 ${contentEditorTab !== "video" ? "hidden xl:block" : ""}`}>
                            <h3 className="text-sm font-bold text-ink">Video CRUD</h3>
                            <Select
                              label="Selected video"
                              value={selectedVideo?._id || ""}
                              onChange={(value) => setSelectedVideoId(value)}
                              options={(videos || []).map((item) => ({
                                value: item._id,
                                label: item.name,
                              }))}
                              placeholder="No videos yet"
                            />
                            <Field
                              label="Video name"
                              value={videoForm.name}
                              onChange={(e) => setVideoForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Video name"
                            />
                            <Field
                              label="Duration"
                              value={videoForm.duration}
                              onChange={(e) => setVideoForm((p) => ({ ...p, duration: e.target.value }))}
                              placeholder="Duration (e.g. 07:19)"
                            />
                            <Field
                              label="Video link"
                              type="url"
                              value={videoForm.videoLink}
                              onChange={(e) => setVideoForm((p) => ({ ...p, videoLink: e.target.value }))}
                              placeholder="Video link"
                            />
                            <div>
                              <label htmlFor="video-summary" className="label">
                                Summary
                              </label>
                              <textarea
                                id="video-summary"
                                value={videoForm.summary}
                                onChange={(e) => setVideoForm((p) => ({ ...p, summary: e.target.value }))}
                                placeholder="Summary"
                                className="field min-h-[90px]"
                              />
                            </div>
                            <div>
                              <label htmlFor="video-photos" className="label">
                                Photos JSON
                              </label>
                              <textarea
                                id="video-photos"
                                value={videoForm.photosText}
                                onChange={(e) => setVideoForm((p) => ({ ...p, photosText: e.target.value }))}
                                placeholder='Photos JSON array: [{"imageLink":"...","imageText":"..."}]'
                                className="field min-h-[90px] font-mono text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button type="button" onClick={handleCreateVideo} disabled={contentSaving}>
                                Create
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={handleUpdateVideo}
                                disabled={contentSaving}
                              >
                                Update
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteVideo}
                                disabled={contentSaving}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>

                        {showRawJson && (
                          <div className="card p-4">
                            <label htmlFor="raw-json-editor" className="label">
                              Raw JSON editor (advanced full-replace mode)
                            </label>
                            <textarea
                              id="raw-json-editor"
                              value={contentDraft}
                              onChange={(e) => setContentDraft(e.target.value)}
                              spellCheck={false}
                              className="field min-h-[260px] font-mono text-xs"
                            />
                          </div>
                        )}
                      </>
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
                {activeTab === "audit" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-ink">Admin Audit Log</h2>
                        <p className="text-xs text-ink-muted">Recent administrative actions recorded in this browser.</p>
                      </div>
                      {auditLogs.length > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => {
                            setAuditLogs([]);
                            try { localStorage.removeItem(AUDIT_KEY); } catch { /* ignore */ }
                          }}
                        >
                          Clear log
                        </Button>
                      )}
                    </div>
                    {auditLogs.length === 0 ? (
                      <EmptyState icon={FaHistory} title="No audit events yet" description="User edits, deletions, and bulk actions will appear here." />
                    ) : (
                      <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-line bg-surface-sunken/70 text-xs text-ink-subtle">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Time</th>
                                <th className="px-4 py-3 font-semibold">Actor</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                                <th className="px-4 py-3 font-semibold">Target</th>
                                <th className="px-4 py-3 font-semibold">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-surface-sunken/35 text-xs">
                                  <td className="px-4 py-2.5 text-ink-subtle tabular-nums whitespace-nowrap">
                                    {new Date(log.at).toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-4 py-2.5 font-semibold text-ink">{log.actor}</td>
                                  <td className="px-4 py-2.5">
                                    <span className="rounded bg-surface-sunken px-2 py-0.5 font-mono text-[11px] font-semibold text-brand">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-ink">{log.target}</td>
                                  <td className="px-4 py-2.5 text-ink-muted">{log.details || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Motion.div>
            </AnimatePresence>
          </main>
        </div>

      {isJsonDirty && (
        <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-e4">
          <span className="flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Unsaved JSON changes
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => setContentDraft(savedJsonBaseline)}>
              Discard
            </Button>
            <Button type="button" className="px-3 py-1 text-xs" onClick={saveCourseContent} loading={contentSaving} loadingText="Saving...">
              Save Course Content
            </Button>
          </div>
        </div>
      )}

      {activeTab === "users" && selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-e4">
          <span className="text-xs font-bold text-ink tabular-nums">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5">
            <Button type="button" className="px-3 py-1 text-xs" onClick={() => runBulkSubscription(true)} loading={bulkBusy}>
              Activate Plan
            </Button>
            <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => runBulkSubscription(false)} disabled={bulkBusy}>
              Set Free
            </Button>
            <Button type="button" variant="danger" className="px-3 py-1 text-xs" onClick={confirmBulkDelete} disabled={bulkBusy}>
              Delete
            </Button>
            <Button type="button" variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setSelectedIds([])} disabled={bulkBusy}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <LiveRegion message={statusMessage} />

      <Modal
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        title="Quick Jump"
        description="Switch admin sections or jump straight to a user."
        size="sm"
      >
        <div className="space-y-3">
          <Field
            label="Search sections or users"
            type="search"
            value={cmdQuery}
            onChange={(e) => setCmdQuery(e.target.value)}
            placeholder="Type a section or user name..."
          />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Sections</p>
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setActiveTab(t.id); setCmdOpen(false); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand"
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {cmdUsers.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Users</p>
              <div className="divide-y divide-line rounded-xl border border-line overflow-hidden">
                {cmdUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => { onEdit(u); setActiveTab("users"); setCmdOpen(false); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-surface-sunken"
                  >
                    <span className="font-semibold text-ink">{u.firstName} {u.lastName}</span>
                    <span className="text-ink-muted truncate max-w-[12rem]">{u.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(editUserId)}
        onClose={() => !saving && setEditUserId("")}
        title="Edit user"
        description={editForm.email || "Update user details and subscription access."}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditUserId("")} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={() => onSave(editUserId)} loading={saving} loadingText="Saving...">Save changes</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field
            label="First name"
            value={editForm.firstName || ""}
            error={editErrors.firstName}
            onBlur={() => setEditErrors((e) => ({ ...e, firstName: validateEditField("firstName", editForm.firstName) }))}
            onChange={(e) => {
              const val = e.target.value;
              setEditForm((p) => ({ ...p, firstName: val }));
              if (editErrors.firstName) setEditErrors((err) => ({ ...err, firstName: validateEditField("firstName", val) }));
            }}
          />
          <Field
            label="Last name"
            value={editForm.lastName || ""}
            onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
          />
          <Field
            label="Email"
            type="email"
            value={editForm.email || ""}
            error={editErrors.email}
            onBlur={() => setEditErrors((e) => ({ ...e, email: validateEditField("email", editForm.email) }))}
            onChange={(e) => {
              const val = e.target.value;
              setEditForm((p) => ({ ...p, email: val }));
              if (editErrors.email) setEditErrors((err) => ({ ...err, email: validateEditField("email", val) }));
            }}
          />
          <Field label="Phone" type="tel" value={editForm.contactNumber || ""} onChange={(e) => setEditForm((p) => ({ ...p, contactNumber: e.target.value }))} />
          <Select label="Account type" value={editForm.accountType || "Student"} onChange={(value) => setEditForm((p) => ({ ...p, accountType: value }))} options={["Student", "Instructor", "Admin"]} />
          <Toggle label="Subscription Purchased" checked={Boolean(editForm.subscriptionPurchased)} onChange={(checked) => setEditForm((p) => ({ ...p, subscriptionPurchased: checked }))} />
        </div>
      </Modal>

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
