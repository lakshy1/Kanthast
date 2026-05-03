import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/colors";

function SkeletonBlock({ width = "100%", height = 16, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock height={120} borderRadius={12} style={{ marginBottom: 12 }} />
      <SkeletonBlock height={16} width="70%" style={{ marginBottom: 8 }} />
      <SkeletonBlock height={12} width="50%" />
    </View>
  );
}

export function ListItemSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonBlock width={44} height={44} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock height={14} width="75%" />
            <SkeletonBlock height={11} width="45%" />
          </View>
        </View>
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profile}>
      <SkeletonBlock width={80} height={80} borderRadius={40} style={{ alignSelf: "center", marginBottom: 16 }} />
      <SkeletonBlock height={18} width="50%" style={{ alignSelf: "center", marginBottom: 8 }} />
      <SkeletonBlock height={13} width="35%" style={{ alignSelf: "center", marginBottom: 32 }} />
      <SkeletonBlock height={14} style={{ marginBottom: 10 }} />
      <SkeletonBlock height={14} width="80%" style={{ marginBottom: 10 }} />
      <SkeletonBlock height={14} width="60%" />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.border,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profile: {
    padding: 24,
  },
});
