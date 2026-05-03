import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getMedicineUsmleContent } from "../utils/api";
import { COLORS } from "../constants/colors";
import { ListItemSkeleton } from "../components/SkeletonLoader";

// View levels
const LEVEL = { SUBJECTS: "subjects", CHAPTERS: "chapters", VIDEOS: "videos" };

export default function ListsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Navigation state
  const [level, setLevel] = useState(LEVEL.SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const loadContent = useCallback(async (force = false) => {
    setError("");
    try {
      const data = await getMedicineUsmleContent(force);
      setSubjects(data?.data?.subjects || []);
    } catch (err) {
      setError(err.message || "Failed to load content.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  // Apply deep-link params every time the screen gains focus.
  // useFocusEffect fires on focus regardless of whether params changed,
  // so tapping the same subject twice or going back and re-tapping works.
  useFocusEffect(
    useCallback(() => {
      const subjectId = route?.params?.subjectId;
      const chapterId = route?.params?.chapterId;
      if (!subjectId || subjects.length === 0) return;
      const found = subjects.find((s) => s._id === subjectId);
      if (!found) return;
      setSelectedSubject(found);
      if (chapterId) {
        const chapterFound = (found.chapters || []).find((c) => c._id === chapterId);
        setSelectedChapter(chapterFound || null);
        setLevel(chapterFound ? LEVEL.VIDEOS : LEVEL.CHAPTERS);
      } else {
        setSelectedChapter(null);
        setLevel(LEVEL.CHAPTERS);
      }
    }, [subjects, route?.params?.subjectId, route?.params?.chapterId, route?.params?._t])
  );

  // Fallback: if subjects load after the screen was already focused with params.
  useEffect(() => {
    const subjectId = route?.params?.subjectId;
    const chapterId = route?.params?.chapterId;
    if (!subjectId || subjects.length === 0) return;
    const found = subjects.find((s) => s._id === subjectId);
    if (!found) return;
    setSelectedSubject(found);
    if (chapterId) {
      const chapterFound = (found.chapters || []).find((c) => c._id === chapterId);
      setSelectedChapter(chapterFound || null);
      setLevel(chapterFound ? LEVEL.VIDEOS : LEVEL.CHAPTERS);
    } else {
      setSelectedChapter(null);
      setLevel(LEVEL.CHAPTERS);
    }
  }, [subjects]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContent(true);
  };

  const goBack = () => {
    if (level === LEVEL.VIDEOS) {
      setLevel(LEVEL.CHAPTERS);
      setSelectedChapter(null);
    } else if (level === LEVEL.CHAPTERS) {
      setLevel(LEVEL.SUBJECTS);
      setSelectedSubject(null);
    }
  };

  // ─── Subjects list ──────────────────────────────────────────────────────
  const renderSubject = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setSelectedSubject(item);
        setLevel(LEVEL.CHAPTERS);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>{item.title?.[0]?.toUpperCase() || "S"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMeta}>
          {(item.chapters || []).length} chapters
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  // ─── Chapters list ──────────────────────────────────────────────────────
  const renderChapter = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setSelectedChapter(item);
        setLevel(LEVEL.VIDEOS);
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.itemIcon, styles.itemIconChapter]}>
        <Text style={styles.itemIconTextChapter}>Ch</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMeta}>
          {(item.videos || []).length} lectures
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  // ─── Videos list ───────────────────────────────────────────────────────
  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() =>
        navigation.navigate("Video", {
          subjectId: selectedSubject._id,
          chapterId: selectedChapter._id,
          videoId: item._id,
          title: item.title,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.playButton}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        {item.duration ? (
          <Text style={styles.itemMeta}>{item.duration}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const getListData = () => {
    if (level === LEVEL.SUBJECTS) return subjects;
    if (level === LEVEL.CHAPTERS) return selectedSubject?.chapters || [];
    if (level === LEVEL.VIDEOS) return selectedChapter?.videos || [];
    return [];
  };

  const getTitle = () => {
    if (level === LEVEL.SUBJECTS) return "Medicine / USMLE";
    if (level === LEVEL.CHAPTERS) return selectedSubject?.title || "Chapters";
    return selectedChapter?.title || "Lectures";
  };

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {level !== LEVEL.SUBJECTS ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        {level === LEVEL.SUBJECTS ? (
          <Text style={styles.headerMeta}>{subjects.length} subjects</Text>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadContent(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={{ padding: 16 }}>
          <ListItemSkeleton count={6} />
        </View>
      ) : (
        <FlatList
          data={getListData()}
          keyExtractor={(item) => item._id || item.title}
          renderItem={
            level === LEVEL.SUBJECTS
              ? renderSubject
              : level === LEVEL.CHAPTERS
              ? renderChapter
              : renderVideo
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.cyan}
              colors={[COLORS.cyan]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No content available.</Text>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  headerMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  list: { padding: 16, gap: 0 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: "rgba(14,165,233,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconText: { fontSize: 18, fontWeight: "900", color: COLORS.cyan },
  itemIconChapter: { backgroundColor: "rgba(20,184,166,0.15)" },
  itemIconTextChapter: { fontSize: 12, fontWeight: "800", color: "#14b8a6" },
  itemTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  itemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textMuted },

  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: "rgba(14,165,233,0.2)",
    borderWidth: 1,
    borderColor: COLORS.borderCyan,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { fontSize: 16, color: COLORS.cyan, marginLeft: 2 },
  videoTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },

  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  errorText: { color: "#fca5a5", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
