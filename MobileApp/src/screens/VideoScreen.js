import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getVideoDetails } from "../utils/api";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");
const VIDEO_HEIGHT = width * (9 / 16);

function extractYouTubeId(url = "") {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

export default function VideoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { subjectId, chapterId, videoId, title } = route.params || {};

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    if (!subjectId || !chapterId || !videoId) {
      setError("Invalid video parameters.");
      setLoading(false);
      return;
    }
    getVideoDetails({ subjectId, chapterId, videoId })
      .then((data) => setDetails(data?.data || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId, chapterId, videoId]);

  const videoUrl = details?.youtubeUrl || details?.videoUrl || "";
  const ytId = extractYouTubeId(videoUrl);
  const embedUrl = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
    : "";

  const displayTitle = details?.title || title || "Lecture";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
      </View>

      {/* Video player */}
      <View style={styles.videoContainer}>
        {loading ? (
          <View style={styles.videoPlaceholder}>
            <ActivityIndicator size="large" color={COLORS.cyan} />
          </View>
        ) : error ? (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !embedUrl ? (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.errorIcon}>📹</Text>
            <Text style={styles.errorText}>Video not available</Text>
          </View>
        ) : (
          <>
            {webViewLoading && (
              <View style={[styles.videoPlaceholder, StyleSheet.absoluteFill]}>
                <ActivityIndicator size="large" color={COLORS.cyan} />
              </View>
            )}
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webView}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => setWebViewLoading(true)}
              onLoad={() => setWebViewLoading(false)}
              javaScriptEnabled
              domStorageEnabled
            />
          </>
        )}
      </View>

      {/* Details */}
      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={[styles.details, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.videoTitle}>{displayTitle}</Text>

        {details?.subject && (
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>{details.subject}</Text>
            {details?.chapter && (
              <>
                <Text style={styles.breadcrumbSep}>›</Text>
                <Text style={styles.breadcrumbText}>{details.chapter}</Text>
              </>
            )}
          </View>
        )}

        {details?.description ? (
          <>
            <Text style={styles.detailLabel}>ABOUT THIS LECTURE</Text>
            <Text style={styles.detailText}>{details.description}</Text>
          </>
        ) : null}

        {details?.keyPoints?.length ? (
          <>
            <Text style={styles.detailLabel}>KEY POINTS</Text>
            {details.keyPoints.map((pt, i) => (
              <View key={i} style={styles.keyPoint}>
                <Text style={styles.keyPointDot}>•</Text>
                <Text style={styles.keyPointText}>{pt}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* Tip card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Watch at 1.5× speed for review, normal speed for first-time learning.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgPrimary,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  videoContainer: {
    width,
    height: VIDEO_HEIGHT,
    backgroundColor: "#000",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#050816",
  },
  webView: { flex: 1, backgroundColor: "#000" },
  errorIcon: { fontSize: 32 },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  detailsScroll: { flex: 1, backgroundColor: COLORS.bgPrimary },
  details: { padding: 20, gap: 12 },
  videoTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  breadcrumbText: { fontSize: 12, color: COLORS.cyan },
  breadcrumbSep: { fontSize: 12, color: COLORS.textMuted },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    marginTop: 8,
  },
  detailText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  keyPoint: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  keyPointDot: { color: COLORS.cyan, fontSize: 14, marginTop: 1 },
  keyPointText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(14,165,233,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderCyan,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: "flex-start",
  },
  tipIcon: { fontSize: 18 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
