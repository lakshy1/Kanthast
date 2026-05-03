import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const { loading } = useAuth();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 180,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // SplashScreen only renders when there is no token (auth stack).
  // After the animation settles, send the user to Login.
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => navigation.replace("PublicTabs"), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <LinearGradient
      colors={[COLORS.bgDeep, COLORS.bgPrimary, COLORS.bgSurface]}
      style={styles.container}
    >
      {/* Glow blob */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>K</Text>
        </View>

        <Text style={styles.logoText}>Kanthast</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Visual Medical Education
      </Animated.Text>

      <View style={styles.dotsContainer}>
        <LoadingDots />
      </View>
    </LinearGradient>
  );
}

function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dots}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: COLORS.cyan,
    opacity: 0.06,
    top: "25%",
  },
  logoContainer: {
    alignItems: "center",
    gap: 14,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoLetter: {
    fontSize: 38,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 80,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
});
