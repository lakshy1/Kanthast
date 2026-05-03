import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../utils/api";
import { COLORS } from "../constants/colors";
import { ProfileSkeleton } from "../components/SkeletonLoader";

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

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const name = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
    : user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Student";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColor = getAvatarColor(name);

  const loadProfile = useCallback(async (force = false) => {
    try {
      const data = await getProfile(force);
      setProfile(data?.user || data?.data || null);
    } catch {
      // use cached user from auth context
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile(true);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const displayProfile = profile || user || {};
  const subStatus = displayProfile.subscriptionStatus || displayProfile.subscription?.status;
  const isActive = subStatus === "active";

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* Avatar card */}
            <View style={styles.avatarCard}>
              <LinearGradient
                colors={[avatarColor + "33", avatarColor + "11"]}
                style={styles.avatarGlow}
              />
              <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileEmail}>{displayProfile.email || "—"}</Text>

              {/* Subscription badge */}
              <View style={[styles.subBadge, { borderColor: isActive ? COLORS.cyan + "55" : COLORS.border }]}>
                <View style={[styles.subDot, { backgroundColor: isActive ? COLORS.success : COLORS.textMuted }]} />
                <Text style={[styles.subBadgeText, { color: isActive ? COLORS.cyan : COLORS.textMuted }]}>
                  {isActive ? "Active Subscription" : "Free Plan"}
                </Text>
              </View>
            </View>

            {/* Info section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              <View style={styles.infoCard}>
                <InfoRow label="First Name" value={displayProfile.firstName} />
                <View style={styles.divider} />
                <InfoRow label="Last Name" value={displayProfile.lastName} />
                <View style={styles.divider} />
                <InfoRow label="Email" value={displayProfile.email} />
                <View style={styles.divider} />
                <InfoRow
                  label="Member Since"
                  value={
                    displayProfile.createdAt
                      ? new Date(displayProfile.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : null
                  }
                />
              </View>
            </View>

            {/* Subscription section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription</Text>
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => navigation.navigate("Subscription")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["rgba(14,165,233,0.15)", "rgba(14,165,233,0.05)"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.upgradeContent}>
                  <Text style={styles.upgradeIcon}>{isActive ? "⭐" : "🔓"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeTitle}>
                      {isActive ? "Manage Subscription" : "Upgrade to Pro"}
                    </Text>
                    <Text style={styles.upgradeSubtitle}>
                      {isActive ? "View your active plan" : "Unlock all courses and content"}
                    </Text>
                  </View>
                  <Text style={styles.upgradeArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionsCard}>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => navigation.navigate("Settings")}
                >
                  <Text style={styles.actionIcon}>⚙️</Text>
                  <Text style={styles.actionText}>Settings</Text>
                  <Text style={styles.actionChevron}>›</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
                  <Text style={styles.actionIcon}>🚪</Text>
                  <Text style={[styles.actionText, { color: COLORS.error }]}>Sign Out</Text>
                  <Text style={styles.actionChevron}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBtnText: { fontSize: 18 },

  avatarCard: {
    alignItems: "center",
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    marginBottom: 20,
    overflow: "hidden",
    gap: 6,
  },
  avatarGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  profileName: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary },
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  subDot: { width: 7, height: 7, borderRadius: 3.5 },
  subBadgeText: { fontSize: 12, fontWeight: "600" },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 },
  infoCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary, maxWidth: "55%", textAlign: "right" },
  divider: { height: 1, backgroundColor: COLORS.border },

  upgradeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCyan,
    overflow: "hidden",
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  upgradeIcon: { fontSize: 24 },
  upgradeTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  upgradeSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  upgradeArrow: { fontSize: 20, color: COLORS.cyan },

  actionsCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIcon: { fontSize: 18 },
  actionText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  actionChevron: { fontSize: 18, color: COLORS.textMuted },
});
