import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import { extractApiErrorMessage } from "@/api-actions/error-utils";
import { setStorageItemAsync } from "@/app/useStorageState";
import LoginCredentials, {
  ForgotPasswordErrorResponse,
  ForgotPasswordRequest,
  ForgotPasswordSuccessResponse,
  HcpOnboardingLoginResponse,
  LoginErrorResponse,
  LoginResponse,
  LoginSuccessResponse,
  ResetPasswordErrorResponse,
  ResetPasswordRequest,
  ResetPasswordSuccessResponse,
  VerifyOTPErrorResponse,
  VerifyOTPRequest,
  VerifyOTPSuccessResponse,
} from "@/data-types/auth";
import { error } from "@/utils/logger";
import * as Sentry from "@sentry/react-native";
import { Alert, Platform } from "react-native";

// Configuration
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000, // 30 seconds
  endpoints: {
    login: "/login",
    forgotPassword: "/forgot-password",
    verifyOTP: "/verify-otp",
    resetPassword: "/reset-password",
  },
};

// Secure token storage
export const TokenStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      await setStorageItemAsync("access_token", token);
    } catch (err) {
      error("Error saving token:", err);
      throw new Error("Failed to save authentication details");
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const SecureStore = await import("expo-secure-store");

      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem("access_token");
        }
        return null;
      } else {
        return await SecureStore.getItemAsync("access_token");
      }
    } catch (err) {
      error("Error retrieving token:", err);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await setStorageItemAsync("access_token", null);
    } catch (err) {
      error("Error removing token:", err);
    }
  },
};

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: { [key: string]: string[] },
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class NetworkError extends Error {
  public isNetworkError = true;

  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const addLoginBreadcrumb = (
  message: string,
  data: Record<string, unknown> = {},
) => {
  Sentry.addBreadcrumb({
    category: "auth.login",
    level: message.includes("failed") ? "warning" : "info",
    message,
    data,
  });
};

const getLoginBodyDiagnostics = (body: Record<string, unknown>) => {
  const serializedBody = JSON.stringify(body);

  return {
    bodySize: serializedBody.length,
    hasEmail: typeof body.email === "string" && body.email.trim().length > 0,
    hasPassword:
      typeof body.password === "string" && body.password.trim().length > 0,
    hasDeviceId:
      typeof body.device_id === "string" && body.device_id.trim().length > 0,
    hasDeviceName: typeof body["device-name"] === "string",
    hasDeviceType: typeof body["device-type"] === "string",
    hasDeviceVersion: typeof body["device-version"] === "string",
  };
};

// Validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCredentials = (credentials: LoginCredentials): void => {
  if (!credentials.email || !credentials.email.trim()) {
    addLoginBreadcrumb("login.validation_failed", {
      hasEmail: false,
      hasPassword:
        typeof credentials.password === "string" &&
        credentials.password.trim().length > 0,
      reason: "missing_email",
    });
    throw new AuthenticationError("Email is required");
  }

  if (!validateEmail(credentials.email)) {
    addLoginBreadcrumb("login.validation_failed", {
      hasEmail: true,
      hasPassword:
        typeof credentials.password === "string" &&
        credentials.password.trim().length > 0,
      reason: "invalid_email",
    });
    throw new AuthenticationError("Please enter a valid email address");
  }

  if (!credentials.password || !credentials.password.trim()) {
    addLoginBreadcrumb("login.validation_failed", {
      hasEmail: true,
      hasPassword: false,
      reason: "missing_password",
    });
    throw new AuthenticationError("Password is required");
  }
};

const hasAccessToken = (data: unknown): data is LoginSuccessResponse => {
  if (!isObject(data) || !isObject(data.data)) return false;

  return (
    typeof data.data.access_token === "string" &&
    data.data.access_token.trim().length > 0
  );
};

const isHcpOnboardingLoginResponse = (
  data: unknown,
): data is HcpOnboardingLoginResponse => {
  if (!isObject(data) || data.status !== true || !isObject(data.data)) {
    return false;
  }

  return typeof data.data.id === "number" && !("access_token" in data.data);
};

const getApiRequestAuthError = (
  error: ApiRequestError,
  fallbackMessage: string,
): AuthenticationError | NetworkError => {
  if (error.kind !== "server") {
    return new NetworkError(error.details.userMessage);
  }

  const data = error.details.data;
  const errorData = isObject(data)
    ? (data as unknown as LoginErrorResponse)
    : undefined;

  return new AuthenticationError(
    extractApiErrorMessage(data, fallbackMessage),
    error.details.statusCode,
    errorData?.errors,
  );
};

const postAuthResource = async <T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const isLoginEndpoint = endpoint === API_CONFIG.endpoints.login;
  const requestBody = isLoginEndpoint ? Object.freeze({ ...body }) : body;

  if (isLoginEndpoint) {
    addLoginBreadcrumb(
      "login.request_started",
      getLoginBodyDiagnostics(requestBody),
    );
  }

  const { data } = await apiRequest<T>({
    url: `${API_CONFIG.baseURL}${endpoint}`,
    endpoint,
    method: "POST",
    body: requestBody,
    timeoutMs: API_CONFIG.timeout,
    retryOnAndroidNetworkError: !isLoginEndpoint && endpoint !== "/logout",
  });

  return data;
};

const loginInternal = async (
  credentials: LoginCredentials,
): Promise<LoginSuccessResponse | HcpOnboardingLoginResponse> => {
  try {
    addLoginBreadcrumb("login.submit_started", {
      hasEmail:
        typeof credentials.email === "string" &&
        credentials.email.trim().length > 0,
      hasPassword:
        typeof credentials.password === "string" &&
        credentials.password.trim().length > 0,
      hasDeviceId:
        typeof credentials.device_id === "string" &&
        credentials.device_id.trim().length > 0,
    });

    // Validate input
    validateCredentials(credentials);

    const loginBody = Object.freeze({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      device_id: credentials.device_id,
      "device-name": credentials.device_name,
      "device-type": credentials.device_type,
      "device-version": credentials.device_version,
    });

    const data = await postAuthResource<LoginResponse>(
      API_CONFIG.endpoints.login,
      loginBody,
    );

    if (hasAccessToken(data)) {
      await TokenStorage.saveToken(data.data.access_token);
      addLoginBreadcrumb("login.request_success");

      return data;
    }

    if (isHcpOnboardingLoginResponse(data)) {
      addLoginBreadcrumb("login.onboarding_required", {
        hcpId: data.data.id,
        status: data.data.status,
      });

      return data;
    }

    if (isObject(data) && data.status === false) {
      const errorData = data as LoginErrorResponse;
      addLoginBreadcrumb("login.request_failed", {
        reason: "auth_rejected",
      });
      throw new AuthenticationError(
        extractApiErrorMessage(data, "Login failed"),
        undefined,
        isObject(data) ? errorData.errors : undefined,
      );
    }

    throw new AuthenticationError("Unexpected response from server");
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }

    if (err instanceof ApiRequestError) {
      addLoginBreadcrumb("login.request_failed", {
        reason: err.kind,
        statusCode: err.details.statusCode,
        wasTimeout: err.details.wasTimeout,
        wasAborted: err.details.wasAborted,
      });
      throw getApiRequestAuthError(err, "Login failed");
    }

    addLoginBreadcrumb("login.request_failed", {
      reason: "unknown",
    });

    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginSuccessResponse | HcpOnboardingLoginResponse> => {
  return loginInternal({ ...credentials });
};

// Login with Alert Handling
export const loginWithAlerts = async (
  credentials: LoginCredentials,
): Promise<LoginSuccessResponse | HcpOnboardingLoginResponse | null> => {
  try {
    const result = await login(credentials);

    if ("access_token" in result.data) {
      Alert.alert("Success", "Login successful!", [{ text: "OK" }]);
    }

    return result;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      let errorMessage = error.message;

      // format error messages
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join("\n");
        errorMessage = errorMessages || error.message;
      }

      Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
    } else if (error instanceof NetworkError) {
      Alert.alert("Connection Error", error.message, [
        { text: "OK" },
        {
          text: "Retry",
          onPress: () => loginWithAlerts(credentials),
        },
      ]);
    } else {
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ]);
    }

    return null;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await TokenStorage.removeToken();
    // cleanup user data
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await TokenStorage.getToken();
  return token !== null;
};

const validateForgotPasswordRequest = (
  request: ForgotPasswordRequest,
): void => {
  if (!request.email || !request.email.trim()) {
    throw new AuthenticationError("Email is required");
  }

  if (!validateEmail(request.email)) {
    throw new AuthenticationError("Please enter a valid email address");
  }
};

const validateVerifyOTPRequest = (request: VerifyOTPRequest): void => {
  if (!request.email || !request.email.trim()) {
    throw new AuthenticationError("Email is required");
  }

  if (!request.otp || !request.otp.trim()) {
    throw new AuthenticationError("Verification code is required");
  }

  if (request.otp.length !== 6) {
    throw new AuthenticationError("Verification code must be 6 digits");
  }
};

const validateResetPasswordRequest = (request: ResetPasswordRequest): void => {
  if (!request.email || !request.email.trim()) {
    throw new AuthenticationError("Email is required");
  }

  if (!request.otp || !request.otp.trim()) {
    throw new AuthenticationError("Verification code is required");
  }

  if (!request.password || !request.password.trim()) {
    throw new AuthenticationError("Password is required");
  }

  if (request.password.length < 6) {
    throw new AuthenticationError("Password must be at least 6 characters");
  }

  if (!request.password_confirmation || !request.password_confirmation.trim()) {
    throw new AuthenticationError("Please confirm your password");
  }

  if (request.password !== request.password_confirmation) {
    throw new AuthenticationError("Passwords do not match");
  }
};

export const sendResetCode = async (
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordSuccessResponse> => {
  try {
    validateForgotPasswordRequest(request);

    const data: ForgotPasswordSuccessResponse | ForgotPasswordErrorResponse =
      await postAuthResource(API_CONFIG.endpoints.forgotPassword, {
        email: request.email.trim().toLowerCase(),
      });

    if (data.status === true) {
      return data as ForgotPasswordSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as ForgotPasswordErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Failed to send reset code",
        undefined,
        errorData.errors,
      );
    }

    throw new AuthenticationError("Unexpected response from server");
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }

    if (err instanceof ApiRequestError) {
      throw getApiRequestAuthError(err, "Failed to send reset code");
    }

    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const verifyResetCode = async (
  request: VerifyOTPRequest,
): Promise<VerifyOTPSuccessResponse> => {
  try {
    validateVerifyOTPRequest(request);

    const data: VerifyOTPSuccessResponse | VerifyOTPErrorResponse =
      await postAuthResource(API_CONFIG.endpoints.verifyOTP, {
        email: request.email.trim().toLowerCase(),
        otp: request.otp.trim(),
      });

    if (data.status === true) {
      return data as VerifyOTPSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as VerifyOTPErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Invalid verification code",
        undefined,
        errorData.errors,
      );
    }

    throw new AuthenticationError("Unexpected response from server");
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }

    if (err instanceof ApiRequestError) {
      throw getApiRequestAuthError(err, "Invalid verification code");
    }

    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};

// Reset Password
export const resetPassword = async (
  request: ResetPasswordRequest,
): Promise<ResetPasswordSuccessResponse> => {
  try {
    validateResetPasswordRequest(request);

    const data: ResetPasswordSuccessResponse | ResetPasswordErrorResponse =
      await postAuthResource(API_CONFIG.endpoints.resetPassword, {
        email: request.email.trim().toLowerCase(),
        otp: request.otp.trim(),
        password: request.password,
        password_confirmation: request.password_confirmation,
      });

    if (data.status === true) {
      return data as ResetPasswordSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as ResetPasswordErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Failed to reset password",
        undefined,
        errorData.errors,
      );
    }

    throw new AuthenticationError("Unexpected response from server");
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw err;
    }

    if (err instanceof ApiRequestError) {
      throw getApiRequestAuthError(err, "Failed to reset password");
    }

    // Generic error
    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};
