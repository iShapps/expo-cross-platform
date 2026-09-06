import { AssistantMessage } from "@/data-types/assistant";
import { Linking } from "react-native";

const SUPPORT_EMAIL = "techsupport@ishapps.com";

// No backend involved — opens the device's email client with the transcript
// pre-filled, so the user reviews and sends it themselves.
export async function escalateToHumanSupport(
  messages: AssistantMessage[],
  userLabel?: string,
): Promise<void> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Me" : "Assistant"}: ${m.text}`)
    .join("\n");

  const subject = `iShapps support request${userLabel ? ` — ${userLabel}` : ""}`;
  const body =
    `Hi team,\n\nI need help with something in the iShapps app. Here's my ` +
    `conversation with the in-app assistant so far:\n\n${transcript}\n\n` +
    `(Please add any extra detail above this line before sending.)`;

  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error("No email app is available on this device.");
  }

  await Linking.openURL(url);
}
