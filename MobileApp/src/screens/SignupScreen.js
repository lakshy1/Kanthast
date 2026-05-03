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
import { sendOtp, signUp as apiSignUp } from "../utils/api";
import { COLORS } from "../constants/colors";

const STEPS = { EMAIL: 0, OTP: 1, DETAILS: 2 };

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      shake();
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      setSuccess("OTP sent! Check your email.");
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim() || otp.length < 4) {
      setError("Please enter the OTP.");
      shake();
      return;
    }
    setError("");
    setSuccess("");
    setStep(STEPS.DETAILS);
  };

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !password) {
      setError("Please fill in all fields.");
      shake();
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      shake();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiSignUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        otp,
      });
      await login(data.token, data.user);
    } catch (err) {
      setError(err.message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = ["Enter Email", "Verify OTP", "Create Account"][step];
  const progress = (step + 1) / 3;

  return (
    <LinearGradient colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]} style={styles.gradient}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>K</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>{stepLabel}</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>

          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            {step === STEPS.EMAIL && (
              <>
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
                  />
                </View>
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Send OTP</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === STEPS.OTP && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>One-Time Password</Text>
                  <Text style={styles.hint}>Sent to {email}</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="• • • • • •"
                    placeholderTextColor={COLORS.textMuted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>
                <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp}>
                  <Text style={styles.btnText}>Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp} disabled={loading}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {step === STEPS.DETAILS && (
              <>
                <View style={styles.row}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>First name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor={COLORS.textMuted}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Last name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor={COLORS.textMuted}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                      <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Create Account</Text>}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Sign in</Text>
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
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },
  header: { alignItems: "center", marginBottom: 24 },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoLetter: { fontSize: 26, fontWeight: "900", color: "#fff" },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.cyan,
    borderRadius: 2,
  },
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
  successBanner: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    padding: 12,
  },
  successText: { color: "#86efac", fontSize: 13, textAlign: "center" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  hint: { fontSize: 11, color: COLORS.textMuted },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  otpInput: { fontSize: 22, letterSpacing: 8, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { padding: 14 },
  eyeText: { fontSize: 18 },
  btn: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendBtn: { alignItems: "center", paddingVertical: 4 },
  resendText: { color: COLORS.textSecondary, fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.cyan, fontSize: 14, fontWeight: "600" },
});
