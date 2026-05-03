import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getChatHistory, createChatSession, sendChatMessage } from "../utils/api";
import { COLORS } from "../constants/colors";

const QUICK_PROMPTS = [
  "How do I reset my password?",
  "Why can't I access videos?",
  "How do I upgrade my plan?",
  "What is the OTP issue?",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>K</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const flatListRef = useRef(null);

  const initSession = useCallback(async () => {
    try {
      const sessionData = await createChatSession();
      const sid = sessionData?.data?.sessionId || sessionData?.sessionId;
      setSessionId(sid);
      if (sid) {
        const histData = await getChatHistory(sid);
        setMessages(histData?.data?.messages || []);
      }
    } catch (err) {
      setError("Failed to start chat session.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    const userMessage = {
      _id: Date.now().toString(),
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    Keyboard.dismiss();

    try {
      const data = await sendChatMessage({ message: msg, sessionId });
      const botMessage = {
        _id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.data?.reply || data?.reply || "I'm here to help!",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errMsg = {
        _id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err.message.includes("rate")
            ? "You're sending messages too fast. Please wait a moment."
            : "Sorry, I couldn't process that. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Starting chat session…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>K</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Kanthast AI</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatTitle}>How can I help you?</Text>
          <Text style={styles.emptyChatSub}>
            Ask me anything about your courses, account, or learning.
          </Text>
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.quickPrompt}
                onPress={() => handleSend(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.createdAt}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: 12 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorBarText}>{error}</Text>
        </View>
      ) : null}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 10 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Type a message…"
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgPrimary,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  botAvatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  onlineText: { fontSize: 11, color: COLORS.success },

  messagesList: { paddingHorizontal: 16, paddingTop: 12 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  bubbleRowUser: { flexDirection: "row-reverse" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  bubbleBot: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.cyan,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, alignSelf: "flex-end" },
  bubbleTimeUser: { color: "rgba(255,255,255,0.65)" },

  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyChatTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  emptyChatSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  quickPrompts: { marginTop: 16, width: "100%", gap: 8 },
  quickPrompt: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
  },
  quickPromptText: { color: COLORS.textSecondary, fontSize: 13 },

  errorBar: {
    backgroundColor: "rgba(239,68,68,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBarText: { color: "#fca5a5", fontSize: 12, textAlign: "center" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgPrimary,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: COLORS.bgSurface },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
