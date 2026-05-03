import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../utils/api";
import { COLORS } from "../constants/colors";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      shake();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);
      await login(data.token, data.user);
    } catch (err) {
      setError(err.message === "SESSION_EXPIRED" ? "Invalid credentials." : err.message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>K</Text>
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Kanthast account</Text>
          </View>

          {/* Form */}
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoLetter: { fontSize: 28, fontWeight: "900", color: "#fff" },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  form: {
    backgroundColor: "rgba(13,24,41,0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
  },
  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    padding: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13, textAlign: "center" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 14 },
  eyeText: { fontSize: 18 },
  loginBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },
});
