import * as Sentry from "@sentry/react-native";
import * as Network from "expo-network";
import { getRuntimeDiagnostics } from "@/utils/runtime-diagnostics";
import { AppState, Platform } from "react-native";

export type ApiRequestKind =
  | "abort"
  | "timeout"
  | "network"
  | "server"
  | "unknown";

export type ApiRequestOptions = {
  url: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, unknown>;
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

type FetchAttemptResult = {
  response: Response;
  receivedResponse: boolean;
  transportMode: "fetch_init";
};

type SerializedBody = {
  body?: string;
  bodySize: number;
};

type FetchAttemptDiagnostics = {
  receivedResponse: boolean;
  transportMode?: "fetch_init";
};

const DEFAULT_TIMEOUT_MS = 30000;
const ANDROID_RETRY_BASE_DELAY_MS = 350;
const ANDROID_RETRY_JITTER_MS = 175;
const MODULE_STARTED_AT = Date.now();
const COLD_START_WINDOW_MS = 30000;
const DEDUPE_REQUEST_KEYS = new Set([
  "POST /refresh-token",
  "POST /get-common-content",
]);

const inFlightCriticalRequests = new Map<
  string,
  Promise<ApiRequestResult<unknown>>
>();
let activeRequestCount = 0;

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
      isValidationError?: boolean;
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

class InvalidApiHeaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidApiHeaderError";
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getBaseRequestKey = (
  options: Pick<ApiRequestOptions, "method" | "endpoint">,
) =>
  `${options.method} ${options.endpoint}`;

const shouldDedupeRequest = (options: ApiRequestOptions) =>
  DEDUPE_REQUEST_KEYS.has(getBaseRequestKey(options));

const stableStringify = (value: unknown, seen = new WeakSet<object>()): string => {
  if (value === null || value === undefined) return String(value);

  const valueType = typeof value;

  if (valueType === "string") return JSON.stringify(value);
  if (valueType === "number" || valueType === "boolean") return String(value);
  if (valueType === "bigint") return `bigint:${String(value)}`;
  if (valueType === "function") return "function";
  if (valueType === "symbol") return "symbol";

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item, seen)).join(",")}]`;
  }

  if (valueType === "object") {
    const objectValue = value as Record<string, unknown>;

    if (seen.has(objectValue)) return "[Circular]";
    seen.add(objectValue);

    const serialized = Object.keys(objectValue)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key], seen)}`)
      .join(",");

    seen.delete(objectValue);

    return `{${serialized}}`;
  }

  return String(value);
};

const createShortHash = (value: string): string => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const createNonSensitiveFingerprint = (value: unknown): string => {
  try {
    const stableValue = stableStringify(value);
    return `body:${createShortHash(stableValue)}`;
  } catch {
    return "body:unavailable";
  }
};

export const createDedupeKey = (options: ApiRequestOptions): string => {
  const baseKey = getBaseRequestKey(options);

  if (options.endpoint === "/login") {
    return baseKey;
  }

  const bodyFingerprint =
    options.body === undefined
      ? "no-body"
      : createNonSensitiveFingerprint(options.body);

  return `${baseKey} ${bodyFingerprint}`;
};

const getBodyFingerprint = (options: ApiRequestOptions): string =>
  options.endpoint === "/login"
    ? "body:omitted"
    : options.body === undefined
      ? "no-body"
      : createNonSensitiveFingerprint(options.body);

const isColdStart = () => Date.now() - MODULE_STARTED_AT <= COLD_START_WINDOW_MS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const validateLoginBody = (body: unknown, requestId: string): void => {
  if (!isRecord(body)) {
    throw new ApiRequestError("Login payload is missing", "unknown", {
      userMessage: "Email and password are required.",
      requestId,
      durationMs: 0,
      wasAborted: false,
      wasTimeout: false,
      isValidationError: true,
    });
  }

  const email = body.email;
  const password = body.password;

  if (typeof email !== "string" || !email.trim()) {
    throw new ApiRequestError("Login email is missing", "unknown", {
      userMessage: "Email is required",
      requestId,
      durationMs: 0,
      wasAborted: false,
      wasTimeout: false,
      isValidationError: true,
    });
  }

  if (typeof password !== "string" || !password.trim()) {
    throw new ApiRequestError("Login password is missing", "unknown", {
      userMessage: "Password is required",
      requestId,
      durationMs: 0,
      wasAborted: false,
      wasTimeout: false,
      isValidationError: true,
    });
  }
};

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

const getTransportFailureReason = (error: unknown): string => {
  if (!(error instanceof Error)) return "unknown";

  const message = error.message.toLowerCase();
  if (error.name === "AbortError") return "abort";
  if (error instanceof ApiRequestTimeoutError) return "timeout";
  if (message.includes("dns") || message.includes("host")) return "dns";
  if (
    message.includes("ssl") ||
    message.includes("certificate") ||
    message.includes("cert")
  ) {
    return "ssl";
  }
  if (
    message.includes("socket") ||
    message.includes("connection reset") ||
    message.includes("connection closed") ||
    message.includes("closed")
  ) {
    return "socket_closed";
  }
  if (
    error instanceof TypeError ||
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("load failed")
  ) {
    return "generic_network_failure";
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
  status: "start" | "success" | "retry" | "deduped" | "error",
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

const HEADER_NAME_OVERRIDES: Record<string, string> = {
  accept: "Accept",
  authorization: "Authorization",
  "content-type": "Content-Type",
};

const isForbiddenHeaderValue = (value: unknown) =>
  typeof value === "object" ||
  typeof value === "function" ||
  typeof value === "symbol";

const normalizeHeaderName = (name: string): string => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new InvalidApiHeaderError("Header name cannot be empty");
  }

  const lowerName = trimmedName.toLowerCase();
  const canonicalName =
    HEADER_NAME_OVERRIDES[lowerName] ??
    lowerName
      .split("-")
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join("-");

  return canonicalName;
};

const sanitizeHeaderValue = (name: string, value: unknown): string | null => {
  if (value === undefined || value === null) return null;

  if (isForbiddenHeaderValue(value)) {
    throw new InvalidApiHeaderError(`Invalid value for header "${name}"`);
  }

  const stringValue = String(value).trim();

  if (
    name.toLowerCase() === "authorization" &&
    (!stringValue ||
      stringValue === "Bearer" ||
      stringValue === "Bearer undefined" ||
      stringValue === "Bearer null")
  ) {
    return null;
  }

  return stringValue;
};

export const sanitizeHeaders = (
  headers: Record<string, unknown>,
): Record<string, string> => {
  const sanitizedHeaders: Record<string, string> = {};
  const seenHeaderNames = new Map<string, string>();

  Object.entries(headers).forEach(([rawName, rawValue]) => {
    const name = normalizeHeaderName(rawName);
    const lowerName = name.toLowerCase();
    const value = sanitizeHeaderValue(name, rawValue);

    if (value === null) return;

    const duplicateName = seenHeaderNames.get(lowerName);
    if (duplicateName) {
      delete sanitizedHeaders[duplicateName];
    }

    seenHeaderNames.set(lowerName, name);
    sanitizedHeaders[name] = value;
  });

  return sanitizedHeaders;
};

export const createJsonHeaders = (
  headers?: Record<string, unknown>,
  hasJsonBody = false,
): Record<string, string> => {
  const sanitizedHeaders = sanitizeHeaders({
    Accept: "application/json",
    ...headers,
  });

  if (hasJsonBody && !sanitizedHeaders["Content-Type"]) {
    sanitizedHeaders["Content-Type"] = "application/json";
  }

  if (!hasJsonBody) {
    delete sanitizedHeaders["Content-Type"];
  }

  return sanitizedHeaders;
};

const getHeaderKeys = (
  headers: Record<string, unknown> | undefined,
  hasJsonBody: boolean,
): string[] => {
  try {
    return Object.keys(createJsonHeaders(headers, hasJsonBody));
  } catch {
    return ["<invalid>"];
  }
};

const serializeJsonBody = (
  body: unknown,
  requestId: string,
  allowBody: boolean,
): SerializedBody => {
  if (!allowBody) {
    return { body: undefined, bodySize: 0 };
  }

  if (body === undefined) {
    return { body: undefined, bodySize: 0 };
  }

  try {
    const serializedBody = JSON.stringify(body);
    return {
      body: serializedBody,
      bodySize: serializedBody?.length ?? 0,
    };
  } catch (error) {
    throw new ApiRequestError(
      error instanceof Error ? error.message : "Failed to serialize request body",
      "unknown",
      {
        userMessage: "Could not prepare the request. Please try again.",
        requestId,
        durationMs: 0,
        wasAborted: false,
        wasTimeout: false,
      },
    );
  }
};

const cloneJsonBodyForRequest = (
  body: unknown,
  requestId: string,
  allowBody: boolean,
): unknown => {
  if (!allowBody || body === undefined) {
    return undefined;
  }

  try {
    const serializedBody = JSON.stringify(body);

    if (serializedBody === undefined) {
      return undefined;
    }

    return JSON.parse(serializedBody);
  } catch (error) {
    throw new ApiRequestError(
      error instanceof Error ? error.message : "Failed to prepare request body",
      "unknown",
      {
        userMessage: "Could not prepare the request. Please try again.",
        requestId,
        durationMs: 0,
        wasAborted: false,
        wasTimeout: false,
        isValidationError: true,
      },
    );
  }
};

const getRetryDelayMs = (retryAttempt: number): number =>
  ANDROID_RETRY_BASE_DELAY_MS * 2 ** Math.max(retryAttempt - 1, 0) +
  Math.floor(Math.random() * ANDROID_RETRY_JITTER_MS);

const getMaxAndroidNetworkRetries = (options: ApiRequestOptions): number => {
  if (Platform.OS !== "android" || options.retryOnAndroidNetworkError !== true) {
    return 0;
  }

  if (options.endpoint === "/login") return 0;
  if (options.method === "GET") return 2;
  if (options.endpoint === "/get-common-content") return 2;

  return 1;
};

const safeFetch = async (
  options: ApiRequestOptions,
  requestId: string,
  attempt: number,
  diagnostics: FetchAttemptDiagnostics,
): Promise<FetchAttemptResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowBody = options.method !== "GET";
  const requestBody = cloneJsonBodyForRequest(
    options.body,
    requestId,
    allowBody,
  );

  if (options.endpoint === "/login") {
    validateLoginBody(requestBody, requestId);
  }

  const serializedBody = serializeJsonBody(requestBody, requestId, allowBody);
  const headers = createJsonHeaders(
    options.headers,
    serializedBody.body !== undefined,
  );
  const headerKeys = Object.keys(headers);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let receivedResponse = false;

  const fetchInit: {
    method: ApiRequestOptions["method"];
    headers: Record<string, string>;
    body?: string;
  } = {
    method: options.method,
    headers: { ...headers },
  };

  if (serializedBody.body !== undefined) {
    fetchInit.body = serializedBody.body;
  }

  const transportMode = "fetch_init";
  diagnostics.transportMode = transportMode;
  const fetchPromise = fetch(options.url, fetchInit).then((response) => {
    receivedResponse = true;
    diagnostics.receivedResponse = true;
    return response;
  });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => reject(new ApiRequestTimeoutError()), timeoutMs);
  });

  addApiBreadcrumb("start", {
    requestId,
    requestKey: createDedupeKey(options),
    endpoint: options.endpoint,
    method: options.method,
    attempt,
    platform: Platform.OS,
    bodyFingerprint: getBodyFingerprint(options),
    timeoutMs,
    appState: AppState.currentState,
    hasBody: serializedBody.body !== undefined,
    bodySize: serializedBody.bodySize,
    headerKeys,
    transportMode,
    ...getRuntimeDiagnostics(),
    requestConcurrencyCount: activeRequestCount,
    dedupeEnabled: shouldDedupeRequest(options),
    deduplicated: false,
    appColdStart: isColdStart(),
  });

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    return { response, receivedResponse, transportMode };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const runApiRequest = async <T>(
  options: ApiRequestOptions,
): Promise<ApiRequestResult<T>> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requestId = createRequestId();
  const startedAt = Date.now();
  const requestKey = createDedupeKey(options);
  const bodyFingerprint = getBodyFingerprint(options);
  let attempt = 0;
  let lastReceivedResponse = false;

  activeRequestCount += 1;

  try {
    while (true) {
      const hasBody = options.method !== "GET" && options.body !== undefined;
      const headerKeys = getHeaderKeys(options.headers, hasBody);
      const diagnostics: FetchAttemptDiagnostics = {
        receivedResponse: false,
      };

      try {
        attempt += 1;
        const fetchResult = await safeFetch(
          options,
          requestId,
          attempt,
          diagnostics,
        );
        const response = fetchResult.response;
        lastReceivedResponse = fetchResult.receivedResponse;
        const transportMode = fetchResult.transportMode;
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
          headerKeys,
          requestConcurrencyCount: activeRequestCount,
          dedupeEnabled: shouldDedupeRequest(options),
          deduplicated: false,
          bodyFingerprint,
          transportMode,
          ...getRuntimeDiagnostics(),
          requestReceivedResponse: lastReceivedResponse,
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
        const receivedResponse: boolean =
          diagnostics.receivedResponse || lastReceivedResponse;
        lastReceivedResponse = receivedResponse;
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
        const retryAttempt = attempt;
        const maxRetries = getMaxAndroidNetworkRetries(options);
        const canRetry =
          (kind === "network" || kind === "abort") &&
          retryAttempt <= maxRetries &&
          network.isConnected !== false;
        const retryDelayMs = canRetry ? getRetryDelayMs(retryAttempt) : undefined;

        const context = {
          requestId,
          requestKey,
          bodyFingerprint,
          transportMode: diagnostics.transportMode ?? "unknown",
          endpoint: options.endpoint,
          method: options.method,
          platform: Platform.OS,
          durationMs,
          timeoutMs,
          attempt,
          retryAttempt,
          retryDelayMs,
          maxRetries,
          headerKeys,
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          wasAborted,
          wasTimeout,
          reason: kind,
          transportFailureReason: getTransportFailureReason(error),
          networkType: network.networkType,
          isConnected: network.isConnected,
          isInternetReachable: network.isInternetReachable,
          appState: AppState.currentState,
          appColdStart: isColdStart(),
          memoryWarning: "unavailable",
          ...getRuntimeDiagnostics(),
          requestConcurrencyCount: activeRequestCount,
          dedupeEnabled: shouldDedupeRequest(options),
          deduplicated: false,
          requestReceivedResponse: receivedResponse,
          failedBeforeResponse: !receivedResponse,
        };

        if (canRetry && retryDelayMs !== undefined) {
          addApiBreadcrumb("retry", context);
          await delay(retryDelayMs);
          continue;
        }

        addApiBreadcrumb("error", context);

        if (
          kind !== "server" &&
          !(error instanceof ApiRequestError && error.details.isValidationError)
        ) {
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
  } finally {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
  }
};

export async function apiRequest<T>(
  options: ApiRequestOptions,
): Promise<ApiRequestResult<T>> {
  const requestKey = createDedupeKey(options);
  const bodyFingerprint = getBodyFingerprint(options);

  if (shouldDedupeRequest(options)) {
    const existingRequest = inFlightCriticalRequests.get(requestKey);

    if (existingRequest) {
      addApiBreadcrumb("deduped", {
        requestId: createRequestId(),
        requestKey,
        endpoint: options.endpoint,
        method: options.method,
        platform: Platform.OS,
        bodyFingerprint,
        requestConcurrencyCount: activeRequestCount,
        ...getRuntimeDiagnostics(),
        dedupeEnabled: true,
        deduplicated: true,
        appState: AppState.currentState,
        appColdStart: isColdStart(),
      });

      return existingRequest as Promise<ApiRequestResult<T>>;
    }

    const request = runApiRequest<T>(options);
    inFlightCriticalRequests.set(
      requestKey,
      request as Promise<ApiRequestResult<unknown>>,
    );

    try {
      return await request;
    } finally {
      if (inFlightCriticalRequests.get(requestKey) === request) {
        inFlightCriticalRequests.delete(requestKey);
      }
    }
  }

  return runApiRequest<T>(options);
}
