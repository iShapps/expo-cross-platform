import { TokenStorage } from "@/utils/auth-api";

// Base URL of this same Expo app's own API routes (see app/api/assistant/).
// Native builds have no "same origin" to fall back to, so this must be set
// to the deployed EAS Hosting URL in production; during `expo start` it can
// point at the local dev server.
const ASSISTANT_BASE_URL = process.env.EXPO_PUBLIC_ASSISTANT_API_URL ?? "";
const API_TIMEOUT = 30000;

export class AssistantQueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AssistantQueryError";
  }
}

function resolveAssistantUrl(path: string): string {
  if (ASSISTANT_BASE_URL) {
    return `${ASSISTANT_BASE_URL.replace(/\/$/, "")}${path}`;
  }
  return path;
}

export type AssistantHistoryTurn = { role: "user" | "assistant"; text: string };

export async function askAssistant(
  message: string,
  history: AssistantHistoryTurn[],
): Promise<string> {
  const token = await TokenStorage.getToken();
  if (!token) {
    throw new AssistantQueryError("You need to be signed in to ask the assistant.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(resolveAssistantUrl("/api/assistant/ask"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new AssistantQueryError(
      err instanceof Error ? err.message : "Network error. Please try again.",
    );
  } finally {
    clearTimeout(timeout);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AssistantQueryError("Invalid response from the assistant.");
  }

  if (!response.ok || !isSuccessPayload(json)) {
    const message =
      json && typeof json === "object" && "message" in json &&
      typeof (json as { message?: unknown }).message === "string"
        ? (json as { message: string }).message
        : "The assistant is temporarily unavailable.";
    const code =
      json && typeof json === "object" && "code" in json &&
      typeof (json as { code?: unknown }).code === "string"
        ? (json as { code: string }).code
        : undefined;
    throw new AssistantQueryError(message, response.status, code);
  }

  return json.data.reply;
}

function isSuccessPayload(
  json: unknown,
): json is { status: true; data: { reply: string } } {
  return (
    !!json &&
    typeof json === "object" &&
    (json as { status?: unknown }).status === true &&
    typeof (json as { data?: { reply?: unknown } }).data?.reply === "string"
  );
}
