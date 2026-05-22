import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../constants/api";
import { COLORS } from "../constants/colors";

const TOPICS = ["General Inquiry", "Technical Support", "Billing", "Content Feedback", "Partnership"];

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert("Missing fields", "Please fill in your name, email, and message.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to send.");
      setSent(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
        <View style={[styles.successContainer, { paddingTop: insets.top }]}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successText}>
            We've received your message and will get back to you within 24–48 hours.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => {
            setSent(false); setName(""); setEmail(""); setMessage(""); setTopic(TOPICS[0]);
          }}>
            <Text style={styles.resetBtnText}>Send Another</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>✉️</Text>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>
              Have a question or feedback? We'd love to hear from you.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Topic</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
                <View style={styles.topicsRow}>
                  {TOPICS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.topicChip, topic === t && styles.topicChipActive]}
                      onPress={() => setTopic(t)}
                    >
                      <Text style={[styles.topicText, topic === t && styles.topicTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us how we can help…"
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>Send Message</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📧</Text>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>support@kanthast.in</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⏱</Text>
              <Text style={styles.infoLabel}>Response Time</Text>
              <Text style={styles.infoValue}>Within 48 hours</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { alignItems: "center", marginBottom: 28, gap: 8 },
  headerEmoji: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },

  form: {
    backgroundColor: "rgba(13,24,41,0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
    marginBottom: 20,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  textArea: { height: 110, paddingTop: 13 },

  topicsScroll: { marginTop: 2 },
  topicsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  topicChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSurface,
  },
  topicChipActive: { borderColor: COLORS.cyan, backgroundColor: "rgba(14,165,233,0.12)" },
  topicText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  topicTextActive: { color: COLORS.cyan, fontWeight: "700" },

  submitBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  infoCards: { flexDirection: "row", gap: 10 },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  infoIcon: { fontSize: 22 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted },
  infoValue: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, textAlign: "center" },

  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: { fontSize: 52 },
  successTitle: { fontSize: 24, fontWeight: "900", color: COLORS.textPrimary },
  successText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
  resetBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  resetBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
