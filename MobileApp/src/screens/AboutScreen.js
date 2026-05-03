import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");

const VALUES = [
  {
    icon: "🎬",
    title: "Visual First",
    desc: "Every concept is explained through animation before text — because seeing is understanding.",
  },
  {
    icon: "🧠",
    title: "Mechanism Over Memory",
    desc: "We teach the 'why' behind every disease and drug so you never forget the details.",
  },
  {
    icon: "🎯",
    title: "Exam Focused",
    desc: "Content is mapped directly to USMLE, NEET PG, and INI CET high-yield topics.",
  },
  {
    icon: "🤝",
    title: "Student Driven",
    desc: "Built by students who've been through the grind — we know what works.",
  },
];

const STATS = [
  { value: "3+", label: "Programs" },
  { value: "100+", label: "Lectures" },
  { value: "24/7", label: "AI Support" },
];

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>K</Text>
          </View>
          <Text style={styles.heroTitle}>About Kanthast</Text>
          <Text style={styles.heroSubtitle}>
            We're on a mission to make medical education visual, memorable, and accessible for every student — wherever they are.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission */}
        <LinearGradient
          colors={["rgba(14,165,233,0.12)", "rgba(14,165,233,0.03)"]}
          style={styles.missionCard}
        >
          <Text style={styles.missionLabel}>OUR MISSION</Text>
          <Text style={styles.missionText}>
            "To transform medical education from rote memorisation into deep, lasting understanding — through the power of visual storytelling."
          </Text>
        </LinearGradient>

        {/* Values */}
        <Text style={styles.sectionTitle}>What We Stand For</Text>
        <View style={styles.valuesGrid}>
          {VALUES.map((v) => (
            <View key={v.title} style={styles.valueCard}>
              <Text style={styles.valueIcon}>{v.icon}</Text>
              <Text style={styles.valueTitle}>{v.title}</Text>
              <Text style={styles.valueDesc}>{v.desc}</Text>
            </View>
          ))}
        </View>

        {/* Programs */}
        <Text style={styles.sectionTitle}>Our Programs</Text>
        <View style={styles.programsList}>
          {[
            { name: "Medicine / USMLE", color: COLORS.cyan, detail: "Step 1 · Step 2 CK · Step 3" },
            { name: "NEET PG", color: "#14b8a6", detail: "Postgraduate entrance" },
            { name: "INI CET", color: "#8b5cf6", detail: "AIIMS · PGIMER · JIPMER" },
          ].map((p) => (
            <View key={p.name} style={styles.programRow}>
              <View style={[styles.programDot, { backgroundColor: p.color }]} />
              <View>
                <Text style={styles.programName}>{p.name}</Text>
                <Text style={styles.programDetail}>{p.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.ctaBtnPrimary}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnPrimaryText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaBtnSecondary}
            onPress={() => navigation.navigate("Contact")}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnSecondaryText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  hero: { alignItems: "center", marginBottom: 28, gap: 10 },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 4,
  },
  logoLetter: { fontSize: 30, fontWeight: "900", color: "#fff" },
  heroTitle: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center" },
  heroSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
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
  statValue: { fontSize: 22, fontWeight: "900", color: COLORS.cyan },
  statLabel: { fontSize: 11, color: COLORS.textMuted },

  missionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCyan,
    padding: 18,
    gap: 8,
    marginBottom: 28,
  },
  missionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.cyan, letterSpacing: 1.5 },
  missionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontStyle: "italic" },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 14 },

  valuesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  valueCard: {
    width: (width - 50) / 2,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 5,
  },
  valueIcon: { fontSize: 22 },
  valueTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  valueDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 17 },

  programsList: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
    marginBottom: 28,
  },
  programRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  programDot: { width: 10, height: 10, borderRadius: 5 },
  programName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  programDetail: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  ctaRow: { flexDirection: "row", gap: 10 },
  ctaBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  ctaBtnSecondary: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaBtnSecondaryText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
});
