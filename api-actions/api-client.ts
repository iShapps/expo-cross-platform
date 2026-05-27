import * as Sentry from "@sentry/react-native";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";

export type ApiRequestKind =
  | "abort"
  | "timeout"
  | "network"
  | "server"
  | "unknown";

type ApiRequestOptions = {
  url: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retryOnAndroidNetworkError?: boolean;
};

type ApiRequestResult<T> = {
  data: T;
  response: Response;
};

type NetworkSnapshot = {
  networkType?: string;
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

const DEFAULT_TIMEOUT_MS = 30000;
const ANDROID_RETRY_DELAY_MS = 350;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public kind: ApiRequestKind,
    public details: {
      statusCode?: number;
      data?: unknown;
      userMessage: string;
      requestId: string;
      durationMs: number;
      wasAborted: boolean;
      wasTimeout: boolean;
      network?: NetworkSnapshot;
    },
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

class ApiRequestTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "ApiRequestTimeoutError";
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getNetworkSnapshot = async (): Promise<NetworkSnapshot> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return {
      networkType: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
    };
  } catch {
    return {};
  }
};

const classifyError = (error: unknown): ApiRequestKind => {
  if (error instanceof ApiRequestTimeoutError) return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "abort";

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      error.name === "NetworkError" ||
      error instanceof TypeError ||
      message.includes("network request failed") ||
      message.includes("failed to fetch") ||
      message.includes("load failed") ||
      message.includes("network error")
    ) {
      return "network";
    }
  }

  return "unknown";
};

const getUserMessage = (
  kind: ApiRequestKind,
  network?: NetworkSnapshot,
): string => {
  if (kind === "abort") {
    return "Request was interrupted. Please try again.";
  }

  if (kind === "timeout") {
    return "The server took too long to respond. Please try again.";
  }

  if (kind === "network") {
    if (network?.isConnected === false) {
      return "Please check your internet connection.";
    }

    return "Could not connect to the server. Please try again shortly.";
  }

  return "An unexpected error occurred. Please try again.";
};

const readJsonResponse = async (response: Response): Promise<unknown> => {
  const responseText = await response.text();
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    if (!response.ok) {
      return { message: responseText.trim() || "Invalid server response" };
    }

    throw new ApiRequestError("Invalid server response (not JSON)", "server", {
      statusCode: response.status,
      data: responseText,
      userMessage: "Invalid server response (not JSON)",
      requestId: "response-parse",
      durationMs: 0,
      wasAborted: false,
      wasTimeout: false,
    });
  }
};

const addApiBreadcrumb = (
  status: "start" | "success" | "retry" | "error",
  data: Record<string, unknown>,
) => {
  Sentry.addBreadcrumb({
    category: "api.request",
    level: status === "error" ? "warning" : "info",
    message: `${String(data.method)} ${String(data.endpoint)} ${status}`,
    data,
  });
};

const captureApiRequestError = (
  error: unknown,
  context: Record<string, unknown>,
) => {
  Sentry.withScope((scope) => {
    scope.setTag("type", "api_network_error");
    scope.setTag("endpoint", String(context.endpoint));
    scope.setTag("method", String(context.method));
    scope.setTag("platform", Platform.OS);
    scope.setLevel("warning");
    scope.setContext("api_network_error", context);

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error("API request failed"));
    }
  });
};

const executeFetch = async (
  options: ApiRequestOptions,
  requestId: string,
): Promise<Response> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const serializedBody =
    options.body === undefined ? undefined : JSON.stringify(options.body);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const fetchPromise = fetch(options.url, {
    method: options.method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: serializedBody,
  });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => reject(new ApiRequestTimeoutError()), timeoutMs);
  });

  addApiBreadcrumb("start", {
    requestId,
    endpoint: options.endpoint,
    method: options.method,
    platform: Platform.OS,
    timeoutMs,
    appState: AppState.currentState,
    hasBody: serializedBody !== undefined,
    bodySize: serializedBody?.length ?? 0,
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export async function apiRequest<T>(
  options: ApiRequestOptions,
): Promise<ApiRequestResult<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requestId = createRequestId();
  const startedAt = Date.now();
  let attempt = 0;

  while (true) {
    try {
      attempt += 1;
      const response = await executeFetch(options, requestId);
      const durationMs = Date.now() - startedAt;
      const data = await readJsonResponse(response);

      addApiBreadcrumb("success", {
        requestId,
        endpoint: options.endpoint,
        method: options.method,
        platform: Platform.OS,
        durationMs,
        statusCode: response.status,
        attempt,
      });

      if (!response.ok) {
        throw new ApiRequestError("Server returned an error response", "server", {
          statusCode: response.status,
          data,
          userMessage: "Server returned an error response",
          requestId,
          durationMs,
          wasAborted: false,
          wasTimeout: false,
        });
      }

      return { data: data as T, response };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const kind =
        error instanceof ApiRequestError ? error.kind : classifyError(error);
      const network = await getNetworkSnapshot();
      const wasAborted = kind === "abort";
      const wasTimeout = kind === "timeout";
      const userMessage =
        error instanceof ApiRequestError
          ? error.details.userMessage
          : getUserMessage(kind, network);

      const context = {
        requestId,
        endpoint: options.endpoint,
        method: options.method,
        platform: Platform.OS,
        durationMs,
        timeoutMs,
        attempt,
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        wasAborted,
        wasTimeout,
        reason: kind,
        networkType: network.networkType,
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        appState: AppState.currentState,
      };

      const shouldRetry =
        Platform.OS === "android" &&
        options.retryOnAndroidNetworkError === true &&
        attempt === 1 &&
        (kind === "network" || kind === "abort") &&
        network.isConnected !== false;

      if (shouldRetry) {
        addApiBreadcrumb("retry", context);
        await delay(ANDROID_RETRY_DELAY_MS);
        continue;
      }

      addApiBreadcrumb("error", context);

      if (kind !== "server") {
        captureApiRequestError(error, context);
      }

      if (error instanceof ApiRequestError) {
        throw error;
      }

      throw new ApiRequestError(
        error instanceof Error ? error.message : userMessage,
        kind,
        {
          userMessage,
          requestId,
          durationMs,
          wasAborted,
          wasTimeout,
          network,
        },
      );
    }
  }
}
