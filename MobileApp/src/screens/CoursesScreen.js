import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");

const PROGRAMS = [
  {
    id: "medicine",
    title: "Medicine / USMLE",
    subtitle: "Step 1 · Step 2 CK · Step 3",
    description:
      "Master pathophysiology, pharmacology, and clinical medicine through 3D animations and case-based learning. Optimized for USMLE Steps 1–3.",
    highlights: ["3D Animations", "Clinical Cases", "High-Yield Topics", "Progress Tracking"],
    accent: COLORS.cyan,
    icon: "🩺",
    tag: "Most Popular",
  },
  {
    id: "neet",
    title: "NEET PG",
    subtitle: "Postgraduate Medical Entrance",
    description:
      "Focused preparation for NEET PG with applied pathophysiology, pharmacology mnemonics, and high-yield summaries for all major subjects.",
    highlights: ["Applied Concepts", "Mnemonics", "Subject Summaries", "Exam Patterns"],
    accent: "#14b8a6",
    icon: "🏥",
    tag: "India",
  },
  {
    id: "inicet",
    title: "INI CET",
    subtitle: "AIIMS · PGIMER · JIPMER",
    description:
      "Clinical reasoning-first preparation for INI CET. Emphasis on integration, grand rounds thinking, and differential diagnosis.",
    highlights: ["Clinical Reasoning", "Grand Rounds", "Differentials", "Integration"],
    accent: "#8b5cf6",
    icon: "⚕️",
    tag: "INI CET",
  },
];

export default function CoursesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#f0f9ff", "#eff6ff", "#ecfeff"]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Programs Built for{"\n"}Every Medical Stage</Text>
        <Text style={styles.pageSubtitle}>
          Animation-first learning tracks with exam-focused pathways.
        </Text>

        {/* Program cards */}
        {PROGRAMS.map((program) => (
          <View key={program.id} style={styles.programCard}>
            {/* Top accent bar */}
            <View style={[styles.accentBar, { backgroundColor: program.accent }]} />

            <View style={styles.programHeader}>
              <Text style={styles.programIcon}>{program.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={[styles.programTag, { borderColor: program.accent + "44" }]}>
                  <Text style={[styles.programTagText, { color: program.accent }]}>
                    {program.tag}
                  </Text>
                </View>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programSubtitle}>{program.subtitle}</Text>
              </View>
            </View>

            <Text style={styles.programDesc}>{program.description}</Text>

            {/* Highlights */}
            <View style={styles.highlights}>
              {program.highlights.map((h) => (
                <View key={h} style={[styles.highlight, { borderColor: program.accent + "33" }]}>
                  <Text style={[styles.highlightDot, { color: program.accent }]}>✓</Text>
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.enrollBtn, { backgroundColor: program.accent }]}
              onPress={() => navigation.navigate("Lists")}
              activeOpacity={0.85}
            >
              <Text style={styles.enrollBtnText}>Explore Content →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: "#0ea5e9", fontSize: 14, fontWeight: "600" },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 36,
    marginBottom: 8,
  },
  pageSubtitle: { fontSize: 14, color: "#475569", lineHeight: 20, marginBottom: 28 },

  programCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  accentBar: { height: 4 },
  programHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 18,
    paddingBottom: 8,
  },
  programIcon: { fontSize: 32, marginTop: 4 },
  programTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  programTagText: { fontSize: 11, fontWeight: "700" },
  programTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  programSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  programDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  highlights: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  highlightDot: { fontSize: 11, fontWeight: "700" },
  highlightText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  enrollBtn: {
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  enrollBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
