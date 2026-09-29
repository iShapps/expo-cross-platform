import { askAssistant, AssistantQueryError } from "@/api-queries/assistant";
import { FontFamily, Radius, Space, Touch, Type, type AppColors } from "@/constants/design";
import { AssistantMessage } from "@/data-types/assistant";
import { useAppTheme } from "@/hooks/use-app-theme";
import { matchLocalKnowledge } from "@/utils/assistant-intent-matcher";
import { escalateToHumanSupport } from "@/utils/support-escalation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "./ctx";

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

const GREETING: AssistantMessage = {
  id: "greeting",
  role: "assistant",
  text: "Hi! I'm the iShapps support assistant. Ask me how to do something in the app, or a question about iShapps and Smart Healthcare Solutions.",
};

export default function SupportChatScreen() {
  const router = useRouter();
  const { user } = useSession();

  const { colors: theme } = useAppTheme();
  const styles = getStyles(theme);

  const [messages, setMessages] = useState<AssistantMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const listRef = useRef<FlatList<AssistantMessage>>(null);

  const userLabel = user?.hcp
    ? `${user.hcp.first_name ?? ""} ${user.hcp.last_name ?? ""}`.trim()
    : undefined;

  const appendMessage = (message: AssistantMessage) => {
    setMessages((current) => [...current, message]);
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    appendMessage({ id: nextMessageId(), role: "user", text });

    const localMatch = matchLocalKnowledge(text);
    if (localMatch) {
      appendMessage({
        id: nextMessageId(),
        role: "assistant",
        text: localMatch.answer,
        action: localMatch.action,
      });
      return;
    }

    setIsSending(true);
    try {
      const history = messages
        .filter((m) => m.id !== GREETING.id)
        .map((m) => ({ role: m.role, text: m.text }));
      const reply = await askAssistant(text, history);
      appendMessage({ id: nextMessageId(), role: "assistant", text: reply });
    } catch (err) {
      // No Anthropic key configured — this isn't an outage, just a smaller
      // assistant, so degrade to local-knowledge-only guidance rather than
      // erroring or offering to escalate.
      const isUnconfigured =
        err instanceof AssistantQueryError && err.code === "not_configured";

      appendMessage({
        id: nextMessageId(),
        role: "assistant",
        text: isUnconfigured
          ? "I can only help with in-app navigation right now — try asking about documents, shifts, schedule, profile, or settings."
          : err instanceof AssistantQueryError
            ? err.message
            : "Sorry, I couldn't reach the assistant right now.",
        isEscalationOffer: !isUnconfigured,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEscalate = async () => {
    setIsEscalating(true);
    try {
      await escalateToHumanSupport(messages, userLabel);
    } catch (err) {
      Alert.alert(
        "Couldn't open email",
        err instanceof Error
          ? err.message
          : "Please email techsupport@ishapps.com directly.",
      );
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Support</Text>
          <Text style={styles.headerSubtitle}>Ask a question or get help</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              styles={styles}
              theme={theme}
              onAction={() => {
                if (!item.action) return;
                router.back();
                router.push(item.action.route as never);
              }}
              onEscalate={handleEscalate}
              isEscalating={isEscalating}
            />
          )}
        />

        {isSending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={theme.primaryStrong} />
            <Text style={styles.typingText}>Thinking…</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your question…"
            placeholderTextColor={theme.textSecondary}
            style={styles.input}
            multiline
            editable={!isSending}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isSending) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isSending}
          >
            <Ionicons name="arrow-up" size={18} color={theme.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={handleEscalate}
          disabled={isEscalating}
          style={styles.humanSupportLink}
        >
          <Ionicons
            name="person-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text style={styles.humanSupportLinkText}>
            {isEscalating ? "Opening email…" : "Talk to a human instead"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  styles,
  theme,
  onAction,
  onEscalate,
  isEscalating,
}: {
  message: AssistantMessage;
  styles: ReturnType<typeof getStyles>;
  theme: AppColors;
  onAction: () => void;
  onEscalate: () => void;
  isEscalating: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}
        >
          {message.text}
        </Text>
      </View>

      {message.action && (
        <TouchableOpacity style={styles.actionChip} onPress={onAction}>
          <Ionicons
            name="arrow-forward-circle-outline"
            size={16}
            color={theme.primaryStrong}
          />
          <Text style={styles.actionChipText}>{message.action.label}</Text>
        </TouchableOpacity>
      )}

      {message.isEscalationOffer && (
        <TouchableOpacity
          style={styles.actionChip}
          onPress={onEscalate}
          disabled={isEscalating}
        >
          <Ionicons name="mail-outline" size={16} color={theme.primaryStrong} />
          <Text style={styles.actionChipText}>
            {isEscalating ? "Opening email…" : "Contact human support"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (theme: AppColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Space.gutter,
      paddingVertical: Space.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    headerTextBlock: {
      flex: 1,
    },
    headerTitle: {
      ...Type.title3,
      color: theme.text,
    },
    headerSubtitle: {
      ...Type.footnote,
      color: theme.textSecondary,
    },
    closeButton: {
      width: Touch.min,
      height: Touch.min,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceMuted,
    },
    messageList: {
      padding: Space.md,
      gap: Space.sm,
      flexGrow: 1,
    },
    bubbleRow: {
      maxWidth: "84%",
      gap: 6,
    },
    bubbleRowUser: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    bubbleRowAssistant: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    bubble: {
      borderRadius: Radius.lg,
      paddingHorizontal: Space.md,
      paddingVertical: Space.sm,
    },
    bubbleUser: {
      backgroundColor: theme.primary,
      borderBottomRightRadius: Radius.xs / 2,
    },
    bubbleAssistant: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: Radius.xs / 2,
    },
    bubbleTextUser: {
      ...Type.callout,
      color: theme.textOnPrimary,
    },
    bubbleTextAssistant: {
      ...Type.callout,
      color: theme.text,
    },
    actionChip: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: Radius.full,
      paddingHorizontal: Space.sm,
      backgroundColor: theme.primarySoft,
    },
    actionChipText: {
      ...Type.caption,
      color: theme.primaryStrong,
    },
    typingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Space.xs,
      paddingHorizontal: Space.md,
      paddingBottom: Space.xxs,
    },
    typingText: {
      ...Type.caption,
      color: theme.textSecondary,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Space.xs,
      paddingHorizontal: Space.md,
      paddingVertical: Space.xs,
    },
    input: {
      flex: 1,
      minHeight: Touch.min,
      maxHeight: 110,
      borderRadius: Radius.xl,
      paddingHorizontal: Space.md,
      paddingTop: 11,
      paddingBottom: 11,
      fontFamily: FontFamily.regular,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.surfaceMuted,
    },
    sendButton: {
      width: Touch.min,
      height: Touch.min,
      borderRadius: Radius.full,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    humanSupportLink: {
      minHeight: Touch.min,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    humanSupportLinkText: {
      ...Type.caption,
      color: theme.textSecondary,
      textDecorationLine: "underline",
    },
  });
