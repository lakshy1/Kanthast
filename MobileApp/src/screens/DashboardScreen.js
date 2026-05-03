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

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 24 },
        ]}
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

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Lists")}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionTitle}>Browse Content</Text>
            <Text style={styles.actionSubtitle}>All subjects & chapters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Chatbot")}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionTitle}>AI Assistant</Text>
            <Text style={styles.actionSubtitle}>Get learning help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Courses")}
          >
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionTitle}>Programs</Text>
            <Text style={styles.actionSubtitle}>USMLE, NEET, INI CET</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionTitle}>Upgrade</Text>
            <Text style={styles.actionSubtitle}>Unlock all content</Text>
          </TouchableOpacity>
        </View>

        {/* Subjects list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medicine / USMLE</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Lists")}>
            <Text style={styles.seeAll}>See all →</Text>
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
          subjects.slice(0, 5).map((subject) => (
            <TouchableOpacity
              key={subject._id}
              style={styles.subjectCard}
              onPress={() => navigation.navigate("Lists", { subjectId: subject._id })}
              activeOpacity={0.8}
            >
              <View style={styles.subjectIcon}>
                <Text style={styles.subjectIconText}>
                  {subject.title?.[0]?.toUpperCase() || "S"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subjectTitle}>{subject.title}</Text>
                <Text style={styles.subjectMeta}>
                  {(subject.chapters || []).length} chapters
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
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

  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: COLORS.cyan, fontWeight: "600" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  actionCard: {
    width: "47%",
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 3,
  },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  actionSubtitle: { fontSize: 11, color: COLORS.textMuted },

  subjectCard: {
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
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(14,165,233,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectIconText: { fontSize: 17, fontWeight: "800", color: COLORS.cyan },
  subjectTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  subjectMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textMuted },

  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
