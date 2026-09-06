import { askAssistant, AssistantQueryError } from "@/api-queries/assistant";
import { Colors, Radii } from "@/constants/theme";
import { AssistantMessage } from "@/data-types/assistant";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const theme = Colors[colorScheme];
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
          <Ionicons name="close" size={20} color={theme.primaryText} />
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
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.typingText}>Thinking…</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your question…"
            placeholderTextColor={theme.secondaryText}
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
            <Ionicons name="arrow-up" size={18} color={theme.white} />
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
            color={theme.secondaryText}
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
  theme: typeof Colors.light;
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
            color={theme.primary}
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
          <Ionicons name="mail-outline" size={16} color={theme.primary} />
          <Text style={styles.actionChipText}>
            {isEscalating ? "Opening email…" : "Contact human support"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.whiteBackground,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    headerTextBlock: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.primaryText,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: Radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.heroBg,
    },
    messageList: {
      padding: 16,
      gap: 12,
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
      borderRadius: Radii.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleUser: {
      backgroundColor: theme.primary,
      borderBottomRightRadius: Radii.xs,
    },
    bubbleAssistant: {
      backgroundColor: theme.heroBg,
      borderBottomLeftRadius: Radii.xs,
    },
    bubbleTextUser: {
      color: theme.white,
      fontSize: 14,
      lineHeight: 20,
    },
    bubbleTextAssistant: {
      color: theme.primaryText,
      fontSize: 14,
      lineHeight: 20,
    },
    actionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: Radii.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionChipText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    typingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    typingText: {
      fontSize: 12,
      color: theme.secondaryText,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: theme.grayBorder,
      borderRadius: Radii.full,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.primaryText,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: Radii.full,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    humanSupportLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingBottom: 10,
    },
    humanSupportLinkText: {
      fontSize: 12,
      color: theme.secondaryText,
      textDecorationLine: "underline",
    },
  });
