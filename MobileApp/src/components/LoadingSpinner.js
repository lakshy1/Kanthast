import React from "react";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";
import { COLORS } from "../constants/colors";

export default function LoadingSpinner({ message, fullScreen = false }) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={COLORS.cyan} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  inline: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
