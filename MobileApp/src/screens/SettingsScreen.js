import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getSettings, updateSettings } from "../utils/api";
import { COLORS } from "../constants/colors";

function SettingRow({ label, description, value, onToggle, type = "toggle" }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? <Text style={styles.settingDesc}>{description}</Text> : null}
      </View>
      {type === "toggle" && (
        <Switch
          value={Boolean(value)}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.cyan + "88" }}
          thumbColor={value ? COLORS.cyan : COLORS.textMuted}
          ios_backgroundColor={COLORS.bgSurface}
        />
      )}
      {type === "nav" && <Text style={styles.settingChevron}>›</Text>}
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    learningReminders: true,
    courseAnnouncements: true,
    analyticsSharing: false,
    reduceMotion: false,
    compactLayout: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      if (data?.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const toggle = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(true);
    try {
      await updateSettings({ [key]: !settings[key] });
    } catch {
      // revert on failure
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Settings</Text>
          {saving ? <ActivityIndicator size="small" color={COLORS.cyan} /> : <View style={{ width: 24 }} />}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.cyan} />
          </View>
        ) : (
          <>
            {/* Notifications */}
            <SectionHeader title="Notifications" />
            <View style={styles.card}>
              <SettingRow
                label="Email Notifications"
                description="Receive emails about your account activity"
                value={settings.emailNotifications}
                onToggle={() => toggle("emailNotifications")}
              />
              <View style={styles.divider} />
              <SettingRow
                label="Learning Reminders"
                description="Daily reminders to keep your streak going"
                value={settings.learningReminders}
                onToggle={() => toggle("learningReminders")}
              />
              <View style={styles.divider} />
              <SettingRow
                label="Course Announcements"
                description="Get notified when new content is added"
                value={settings.courseAnnouncements}
                onToggle={() => toggle("courseAnnouncements")}
              />
            </View>

            {/* Privacy */}
            <SectionHeader title="Privacy" />
            <View style={styles.card}>
              <SettingRow
                label="Analytics Sharing"
                description="Help improve Kanthast by sharing usage data"
                value={settings.analyticsSharing}
                onToggle={() => toggle("analyticsSharing")}
              />
            </View>

            {/* Appearance */}
            <SectionHeader title="Appearance" />
            <View style={styles.card}>
              <SettingRow
                label="Reduce Motion"
                description="Minimise animations throughout the app"
                value={settings.reduceMotion}
                onToggle={() => toggle("reduceMotion")}
              />
              <View style={styles.divider} />
              <SettingRow
                label="Compact Layout"
                description="Denser content layout for more information"
                value={settings.compactLayout}
                onToggle={() => toggle("compactLayout")}
              />
            </View>

            {/* Account */}
            <SectionHeader title="Account" />
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => navigation.navigate("Subscription")}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Subscription</Text>
                  <Text style={styles.settingDesc}>Manage your plan</Text>
                </View>
                <Text style={styles.settingChevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                <Text style={[styles.settingLabel, { color: COLORS.error }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* App info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>Kanthast</Text>
              <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
              <Text style={styles.appInfoTagline}>Visual Medical Education</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backText: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },
  pageTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  settingDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  settingChevron: { fontSize: 20, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border },

  appInfo: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  appInfoText: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  appInfoVersion: { fontSize: 12, color: COLORS.textMuted },
  appInfoTagline: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
