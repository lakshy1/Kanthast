import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMedicineUsmleContent } from "../utils/api";
import { getDailyQuote } from "../constants/quotes";
import { COLORS } from "../constants/colors";
import { ListItemSkeleton } from "../components/SkeletonLoader";

const AVATAR_COLORS = [
  COLORS.avatarCyan,
  COLORS.avatarTeal,
  COLORS.avatarAmber,
  COLORS.avatarPurple,
  COLORS.avatarGreen,
];

function getAvatarColor(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Each chapter card — uses useNavigation() so it always has the correct nav context
function ChapterCard({ chapter, subjectId }) {
  const navigation = useNavigation();
  const videoCount = (chapter.videos || []).length;
  return (
    <TouchableOpacity
      style={styles.chapterCard}
      activeOpacity={0.75}
      onPress={() =>
        navigation.navigate("Lists", {
          subjectId,
          chapterId: chapter._id,
          _t: Date.now(),
        })
      }
    >
      <View style={styles.chapterIconWrap}>
        <Text style={styles.chapterIconText}>Ch</Text>
      </View>
      <Text style={styles.chapterTitle} numberOfLines={2}>{chapter.title}</Text>
      <Text style={styles.chapterMeta}>{videoCount} lecture{videoCount !== 1 ? "s" : ""}</Text>
    </TouchableOpacity>
  );
}

// Each subject section — uses useNavigation() directly
function SubjectSection({ subject }) {
  const navigation = useNavigation();
  const chapters = subject.chapters || [];
  const totalVideos = chapters.reduce((acc, c) => acc + (c.videos || []).length, 0);

  return (
    <View style={styles.subjectSection}>
      {/* Subject name row — tap → chapters level */}
      <TouchableOpacity
        style={styles.subjectHeader}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Lists", { subjectId: subject._id, _t: Date.now() })
        }
      >
        <View style={styles.subjectIconWrap}>
          <Text style={styles.subjectIconText}>{subject.title?.[0]?.toUpperCase() || "S"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{subject.title}</Text>
          <Text style={styles.subjectMeta}>
            {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} · {totalVideos} lecture{totalVideos !== 1 ? "s" : ""}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Horizontal chapter cards — tap → videos level */}
      {chapters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.chaptersRow}
        >
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter._id || chapter.title}
              chapter={chapter}
              subjectId={subject._id}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const quote = getDailyQuote();

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "Student";
  const avatarColor = getAvatarColor(firstName);
  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || firstName[1] || "");

  const loadContent = useCallback(async (force = false) => {
    try {
      const data = await getMedicineUsmleContent(force);
      setContent(data);
    } catch {
      // show cached or empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadContent(true);
  };

  const subjects = content?.data?.subjects || [];
  const totalVideos = subjects.reduce(
    (acc, s) => acc + (s.chapters || []).reduce((a, c) => a + (c.videos || []).length, 0),
    0
  );

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Ready to study today?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={[styles.avatar, { backgroundColor: avatarColor }]}
          >
            <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily quote */}
        <LinearGradient
          colors={["rgba(14,165,233,0.12)", "rgba(14,165,233,0.04)"]}
          style={styles.quoteCard}
        >
          <Text style={styles.quoteLabel}>TODAY'S QUOTE</Text>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{subjects.length}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalVideos}</Text>
            <Text style={styles.statLabel}>Lectures</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.cyan }]}>
              {user?.subscriptionStatus === "active" ? "Active" : "Free"}
            </Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Subject sections */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medicine / USMLE</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Lists")}>
            <Text style={styles.seeAll}>Browse all →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ListItemSkeleton count={4} />
        ) : subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No content yet. Pull to refresh.</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <SubjectSection key={subject._id || subject.title} subject={subject} />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCyan,
    padding: 16,
    marginBottom: 20,
    gap: 6,
  },
  quoteLabel: { fontSize: 10, fontWeight: "700", color: COLORS.cyan, letterSpacing: 1.5 },
  quoteText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: "center",
    gap: 3,
  },
  statValue: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.cyan, fontWeight: "600" },

  subjectSection: { marginBottom: 24 },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  subjectIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(14,165,233,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectIconText: { fontSize: 18, fontWeight: "900", color: COLORS.cyan },
  subjectName: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  subjectMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },

  chaptersRow: {
    paddingHorizontal: 4,
    gap: 10,
  },
  chapterCard: {
    width: 140,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 6,
  },
  chapterIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(20,184,166,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  chapterIconText: { fontSize: 11, fontWeight: "800", color: "#14b8a6" },
  chapterTitle: { fontSize: 12, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 17 },
  chapterMeta: { fontSize: 10, color: COLORS.textMuted },

  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
