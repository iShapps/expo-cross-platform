import * as Sentry from "@sentry/react-native";

type AuthExpiredPayload = {
  message: string;
  statusCode: number;
};

type AuthExpiredHandler = (payload: AuthExpiredPayload) => void | Promise<void>;

let authExpiredHandler: AuthExpiredHandler | null = null;
let isHandlingAuthExpired = false;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectMessages(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    const message = value.trim();
    return message ? [message] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectMessages);
  }

  if (isObject(value)) {
    return Object.values(value).flatMap(collectMessages);
  }

  return [];
}

export function logApiErrorToSentry(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const message = extractApiErrorMessage(
    isObject(error) ? error : undefined,
    "API request failed",
  );

  Sentry.withScope((scope) => {
    scope.setTag("type", "api_error");

    if (isObject(error)) {
      scope.setContext("api_error", {
        ...error,
        ...context,
      });
    } else {
      scope.setContext("api_error", {
        error,
        ...context,
      });
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error(message));
    }
  });
}

export function extractApiErrorMessage(
  data: unknown,
  fallbackMessage: string,
): string {
  if (!isObject(data)) return fallbackMessage;

  const candidates = [
    data.message,
    data.error,
    data.detail,
    data.title,
    isObject(data.body) ? data.body.message : undefined,
    isObject(data.body) ? data.body.error : undefined,
    isObject(data.body) ? data.body.errors : undefined,
    isObject(data.data) ? data.data.message : undefined,
    isObject(data.data) ? data.data.error : undefined,
    isObject(data.data) ? data.data.errors : undefined,
    data.errors,
  ];

  for (const candidate of candidates) {
    const messages = collectMessages(candidate);
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return fallbackMessage;
}

export function isUnauthorizedStatus(statusCode?: number): boolean {
  return statusCode === 401 || statusCode === 403;
}

export function isAuthError(error: unknown): boolean {
  return (
    isObject(error) &&
    (error.isAuthError === true ||
      isUnauthorizedStatus(
        typeof error.statusCode === "number" ? error.statusCode : undefined,
      ))
  );
}

export function registerAuthExpiredHandler(handler: AuthExpiredHandler) {
  authExpiredHandler = handler;

  return () => {
    if (authExpiredHandler === handler) {
      authExpiredHandler = null;
    }
  };
}

export async function notifyAuthExpired(payload: AuthExpiredPayload) {
  if (isHandlingAuthExpired) return;

  isHandlingAuthExpired = true;

  try {
    Sentry.withScope((scope) => {
      scope.setTag("type", "auth_expired");
      scope.setLevel("warning");
      scope.setContext("auth_expired", payload);

      Sentry.captureMessage(payload.message || "Authentication expired");
    });

    await authExpiredHandler?.(payload);
  } finally {
    isHandlingAuthExpired = false;
  }
}
