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

const COURSES = [
  {
    id: "medicine",
    title: "Medicine / USMLE",
    description: "3D animations and clinical cases for Step 1, 2 & 3",
    tag: "Most Popular",
    tagColor: COLORS.cyan,
    accent: "#0ea5e9",
  },
  {
    id: "neet",
    title: "NEET PG",
    description: "High-yield pathophysiology for PG entrance exams",
    tag: "India",
    tagColor: "#14b8a6",
    accent: "#14b8a6",
  },
  {
    id: "inicet",
    title: "INI CET",
    description: "Clinical reasoning-first prep for AIIMS & PGIMER",
    tag: "INI CET",
    tagColor: "#8b5cf6",
    accent: "#8b5cf6",
  },
];

const FEATURES = [
  { icon: "🎬", title: "3D Animations", desc: "Visual learning with medical-grade animations" },
  { icon: "📊", title: "Track Progress", desc: "Streak tracking and chapter completion" },
  { icon: "🤖", title: "AI Support", desc: "24/7 AI chatbot for learning questions" },
  { icon: "⚡", title: "Offline Cache", desc: "Content cached for faster access" },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav bar */}
        <View style={styles.navbar}>
          <View style={styles.navLogo}>
            <View style={styles.navLogoMark}>
              <Text style={styles.navLogoLetter}>K</Text>
            </View>
            <Text style={styles.navLogoText}>Kanthast</Text>
          </View>
          {/* Auth buttons */}
          <View style={styles.navActions}>
            <TouchableOpacity
              style={styles.navLoginBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <Text style={styles.navLoginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navSignupBtn}
              onPress={() => navigation.navigate("Signup")}
              activeOpacity={0.85}
            >
              <Text style={styles.navSignupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Visual Medical Education</Text>
          </View>

          <Text style={styles.heroTitle}>
            Learn Medicine{"\n"}
            <Text style={styles.heroTitleAccent}>Visually</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Animation-first courses for USMLE, NEET PG, and INI CET. Build lasting understanding, not just memory.
          </Text>

          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.heroBtnText}>Start Learning →</Text>
          </TouchableOpacity>
        </View>

        {/* Courses */}
        <Text style={styles.sectionTitle}>Programs</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coursesRow}
        >
          {COURSES.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => navigation.navigate("Courses")}
              activeOpacity={0.85}
            >
              <View style={[styles.courseAccent, { backgroundColor: course.accent + "22" }]}>
                <View style={[styles.courseAccentDot, { backgroundColor: course.accent }]} />
              </View>
              <View style={[styles.courseTag, { borderColor: course.tagColor + "44" }]}>
                <Text style={[styles.courseTagText, { color: course.tagColor }]}>
                  {course.tag}
                </Text>
              </View>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDesc}>{course.description}</Text>
              <Text style={[styles.courseArrow, { color: course.accent }]}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Features */}
        <Text style={styles.sectionTitle}>Why Kanthast</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((feat) => (
            <View key={feat.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feat.icon}</Text>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <LinearGradient
          colors={["rgba(14,165,233,0.15)", "rgba(14,165,233,0.05)"]}
          style={styles.ctaCard}
        >
          <Text style={styles.ctaTitle}>Ready to ace your exam?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of medical students using Kanthast.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate("Subscription")}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>View Plans</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  navActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLoginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navLoginText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  navSignupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.cyan,
  },
  navSignupText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  navLogo: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLogoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  navLogoLetter: { fontSize: 17, fontWeight: "900", color: "#fff" },
  navLogoText: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },

  hero: {
    marginBottom: 36,
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(14,165,233,0.1)",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.cyan },
  heroBadgeText: { fontSize: 12, color: COLORS.cyan, fontWeight: "600" },
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.textPrimary,
    lineHeight: 44,
  },
  heroTitleAccent: { color: COLORS.cyan },
  heroSubtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  heroBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 4,
  },
  heroBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 14,
  },

  coursesRow: { paddingRight: 20, gap: 12, marginBottom: 32 },
  courseCard: {
    width: width * 0.65,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 6,
    overflow: "hidden",
  },
  courseAccent: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  courseAccentDot: { width: 10, height: 10, borderRadius: 5 },
  courseTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  courseTagText: { fontSize: 11, fontWeight: "700" },
  courseTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  courseDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  courseArrow: { fontSize: 18, fontWeight: "700", marginTop: 4 },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    width: (width - 50) / 2,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 4,
  },
  featureIcon: { fontSize: 22, marginBottom: 2 },
  featureTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },

  ctaCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.2)",
    padding: 22,
    alignItems: "center",
    gap: 8,
  },
  ctaTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
  ctaSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
  ctaBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 24,
    marginTop: 6,
  },
  ctaBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
