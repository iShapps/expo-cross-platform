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

export function isRequestTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function isFetchNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    error.name === "NetworkError" ||
    (error instanceof TypeError &&
      (message.includes("network request failed") ||
        message.includes("failed to fetch") ||
        message.includes("load failed"))) ||
    message.includes("network error") ||
    message.includes("internet connection")
  );
}

export function isTransientNetworkError(error: unknown): boolean {
  return isRequestTimeoutError(error) || isFetchNetworkError(error);
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
  if (isTransientNetworkError(error)) {
    Sentry.addBreadcrumb({
      category: "api.network",
      level: "warning",
      message:
        error instanceof Error ? error.message : "Transient API network error",
      data: context,
    });
    return;
  }

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

export function captureApiNetworkErrorToSentry(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const message =
    error instanceof Error ? error.message : "API network request failed";

  Sentry.withScope((scope) => {
    scope.setTag("type", "api_network_error");
    scope.setLevel("warning");

    if (context?.endpoint) {
      scope.setTag("endpoint", String(context.endpoint));
    }

    scope.setContext("api_network_error", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: message,
      ...context,
    });

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
