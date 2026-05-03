import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "₹999",
    period: "/month",
    description: "Full access, billed monthly",
    popular: false,
    accent: "#14b8a6",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    price: "₹2,499",
    period: "/3 months",
    description: "Save 17% vs monthly",
    popular: true,
    accent: COLORS.cyan,
  },
  {
    id: "annual",
    label: "Annual",
    price: "₹7,999",
    period: "/year",
    description: "Best value — save 33%",
    popular: false,
    accent: "#8b5cf6",
  },
];

const FEATURES = [
  "All Medicine / USMLE content",
  "NEET PG preparation modules",
  "INI CET study materials",
  "3D animations & clinical cases",
  "AI-powered study assistant",
  "Progress tracking & streaks",
  "Offline content caching",
  "Priority support",
];

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState("quarterly");
  const [loading, setLoading] = useState(false);

  const isActive = user?.subscriptionStatus === "active";

  const handlePurchase = () => {
    Alert.alert(
      "Complete Purchase",
      "Payment is handled via the web app. Visit kanthast.in to complete your subscription.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Website", onPress: () => {} },
      ]
    );
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text style={styles.heroTitle}>
            {isActive ? "You're Pro!" : "Unlock Everything"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isActive
              ? "You have full access to all Kanthast content."
              : "Get full access to all medical courses, AI support, and more."}
          </Text>
        </View>

        {/* Active state */}
        {isActive ? (
          <View style={styles.activeCard}>
            <LinearGradient
              colors={["rgba(34,197,94,0.15)", "rgba(34,197,94,0.05)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.activeIcon}>✅</Text>
            <Text style={styles.activeTitle}>Subscription Active</Text>
            <Text style={styles.activeSubtitle}>
              You have access to all premium content.
            </Text>
          </View>
        ) : (
          <>
            {/* Plan selector */}
            <Text style={styles.sectionTitle}>Choose a Plan</Text>
            <View style={styles.plansContainer}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selected === plan.id && {
                      borderColor: plan.accent,
                      backgroundColor: plan.accent + "12",
                    },
                  ]}
                  onPress={() => setSelected(plan.id)}
                  activeOpacity={0.85}
                >
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: plan.accent }]}>
                      <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                    </View>
                  )}
                  <View style={styles.planRadio}>
                    <View
                      style={[
                        styles.planRadioInner,
                        selected === plan.id && { backgroundColor: plan.accent },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planLabel}>{plan.label}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planPrice, { color: plan.accent }]}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Features */}
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.featuresCard}>
              {FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.purchaseBtn, loading && styles.purchaseBtnDisabled]}
              onPress={handlePurchase}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.purchaseBtnText}>
                  Get Started with {PLANS.find((p) => p.id === selected)?.label}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Payments are processed securely. Cancel anytime.
            </Text>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  backText: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },

  hero: { alignItems: "center", marginBottom: 32, gap: 8 },
  heroEmoji: { fontSize: 40, marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center" },
  heroSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },

  activeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    overflow: "hidden",
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  activeIcon: { fontSize: 36 },
  activeTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  activeSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 12 },
  plansContainer: { gap: 10, marginBottom: 28 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  popularBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioInner: { width: 10, height: 10, borderRadius: 5 },
  planLabel: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  planDescription: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  planPricing: { alignItems: "flex-end" },
  planPrice: { fontSize: 18, fontWeight: "800" },
  planPeriod: { fontSize: 11, color: COLORS.textMuted },

  featuresCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { fontSize: 14, color: COLORS.cyan, fontWeight: "700", width: 18 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },

  purchaseBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 12,
  },
  purchaseBtnDisabled: { opacity: 0.6 },
  purchaseBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer: { textAlign: "center", color: COLORS.textMuted, fontSize: 12 },
});
