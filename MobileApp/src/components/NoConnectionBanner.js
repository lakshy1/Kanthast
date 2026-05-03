import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export default function NoConnectionBanner({ visible }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : -80,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  text: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
