import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { TokenStorage } from "@/utils/auth-api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://admin.ishapps.com/shapp-dev/api/v2";
const API_TIMEOUT = 30000;

const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`;

export type OnboardingHcpDetails = {
  id: number;
  hcp_prefix: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  status: string;
  app_registration_screen: string | null;
  email: string | null;
  contact_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  next_of_kin: string | null;
  address: string | null;
  suburb_name: string | null;
  city_name: string | null;
  post_code: string | null;
  state: { id: number; name: string } | null;
  registration_number: string | null;
  tfn_number: string | null;
  about_me: string | null;
  cv: string | null;
  hcp_professions: {
    category?: { id: number; name: string } | null;
    profession?: { id: number; name: string } | null;
    level?: { id: number; name: string } | null;
  }[];
  hcp_documents: unknown[];
};

export type OnboardingHcpResponse = {
  status: true;
  data: OnboardingHcpDetails;
};

export class OnboardingQueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "OnboardingQueryError";
  }
}

export async function getOnboardingHcp(
  hcpId: number,
): Promise<OnboardingHcpResponse> {
  try {
    const endpoint = `/hcps/${hcpId}`;
    const token = await TokenStorage.getToken();
    const headers: Record<string, unknown> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const { data } = await apiRequest<OnboardingHcpResponse>({
      url: getApiUrl(endpoint),
      endpoint,
      method: "GET",
      headers,
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const message = extractApiErrorMessage(
        error.details.data,
        "Could not load onboarding details.",
      );

      if (
        error.kind === "server" &&
        isUnauthorizedStatus(error.details.statusCode)
      ) {
        await notifyAuthExpired({
          message,
          statusCode: error.details.statusCode ?? 0,
        });
      }

      throw new OnboardingQueryError(
        message,
        error.details.statusCode,
        error.details.data,
      );
    }

    throw new OnboardingQueryError(
      error instanceof Error
        ? error.message
        : "Could not load onboarding details.",
    );
  }
}
