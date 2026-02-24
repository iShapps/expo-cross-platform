import { setStorageItemAsync } from "@/app/useStorageState";
import LoginCredentials, {
  ForgotPasswordErrorResponse,
  ForgotPasswordRequest,
  ForgotPasswordSuccessResponse,
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
import { Alert, Platform } from "react-native";

// Configuration
const API_CONFIG = {
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    "https://admin.ishapps.com/shapp-dev/api",
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
    } catch (error) {
      console.error("Error saving token:", error);
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
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      await setStorageItemAsync("access_token", null);
    } catch (error) {
      console.error("Error removing token:", error);
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
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// Validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCredentials = (credentials: LoginCredentials): void => {
  if (!credentials.email || !credentials.email.trim()) {
    throw new AuthenticationError("Email is required");
  }

  if (!validateEmail(credentials.email)) {
    throw new AuthenticationError("Please enter a valid email address");
  }

  if (!credentials.password || !credentials.password.trim()) {
    throw new AuthenticationError("Password is required");
  }
};

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginSuccessResponse> => {
  try {
    // Validate input
    validateCredentials(credentials);

    console.log("Logging in with credentials:", { credentials });
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          device_id: credentials.device_id,
          "device-name": credentials.device_name,
          "device-type": credentials.device_type,
          "device-version": credentials.device_version,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const data: LoginResponse = await response.json();

    if (response.ok && data.status === true) {
      await TokenStorage.saveToken(data.data.access_token);

      return data as LoginSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as LoginErrorResponse;
      console.log("errorData", errorData);
      throw new AuthenticationError(
        errorData.message || "Login failed",
        response.status,
        errorData.errors,
      );
    }

    throw new AuthenticationError(
      "Unexpected response from server",
      response.status,
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new NetworkError(
        "Network error. Please check your internet connection.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timeout. Please try again.");
    }

    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};

// Login with Alert Handling
export const loginWithAlerts = async (
  credentials: LoginCredentials,
): Promise<LoginSuccessResponse | null> => {
  try {
    const result = await login(credentials);

    Alert.alert("Success", "Login successful!", [{ text: "OK" }]);

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.forgotPassword}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: request.email.trim().toLowerCase(),
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const data: ForgotPasswordSuccessResponse | ForgotPasswordErrorResponse =
      await response.json();

    if (response.ok && data.status === true) {
      return data as ForgotPasswordSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as ForgotPasswordErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Failed to send reset code",
        response.status,
        errorData.errors,
      );
    }

    throw new AuthenticationError(
      "Unexpected response from server",
      response.status,
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new NetworkError(
        "Network error. Please check your internet connection.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timeout. Please try again.");
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.verifyOTP}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: request.email.trim().toLowerCase(),
          otp: request.otp.trim(),
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const data: VerifyOTPSuccessResponse | VerifyOTPErrorResponse =
      await response.json();

    if (response.ok && data.status === true) {
      return data as VerifyOTPSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as VerifyOTPErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Invalid verification code",
        response.status,
        errorData.errors,
      );
    }

    throw new AuthenticationError(
      "Unexpected response from server",
      response.status,
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new NetworkError(
        "Network error. Please check your internet connection.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timeout. Please try again.");
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_CONFIG.endpoints.resetPassword}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: request.email.trim().toLowerCase(),
          otp: request.otp.trim(),
          password: request.password,
          password_confirmation: request.password_confirmation,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const data: ResetPasswordSuccessResponse | ResetPasswordErrorResponse =
      await response.json();

    if (response.ok && data.status === true) {
      return data as ResetPasswordSuccessResponse;
    }

    if (!data.status) {
      const errorData = data as ResetPasswordErrorResponse;
      throw new AuthenticationError(
        errorData.message || "Failed to reset password",
        response.status,
        errorData.errors,
      );
    }

    throw new AuthenticationError(
      "Unexpected response from server",
      response.status,
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new NetworkError(
        "Network error. Please check your internet connection.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timeout. Please try again.");
    }

    // Generic error
    throw new AuthenticationError(
      "An unexpected error occurred. Please try again.",
    );
  }
};
