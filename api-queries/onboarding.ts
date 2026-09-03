import { apiRequest, ApiRequestError } from "@/api-actions/api-client";
import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { Hcp } from "@/data-types/auth";
import { TokenStorage } from "@/utils/auth-api";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TIMEOUT = 30000;

const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL!.replace(/\/$/, "")}${endpoint}`;

export type ProfessionDocument = {
  id: number;
  name: string;
  doc_type: string;
  mandatory_status: "yes" | "no";
  expiry_date_mandatory: "yes" | "no";
};

export type ProfessionRequiredDocumentsResponse = {
  status: true;
  data: {
    profession: {
      id: number;
      name: string;
      category: { id: number; name: string };
    };
    required_documents: ProfessionDocument[];
    general_documents: ProfessionDocument[];
  };
};

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
  abn_number: string | null;
  tfn_number: string | null;
  about_me: string | null;
  cv: string | null;
  hcp_professions: {
    id: number;
    profession_id: number;
    category_id: number;
    status: string;
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

export async function getProfessionRequiredDocuments(
  professionId: number,
): Promise<ProfessionRequiredDocumentsResponse> {
  try {
    const endpoint = `/v2/lookups/professions/${professionId}/required-documents`;
    const token = await TokenStorage.getToken();
    const headers: Record<string, unknown> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const { data } = await apiRequest<ProfessionRequiredDocumentsResponse>({
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
        "Could not load profession documents.",
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
        : "Could not load profession documents.",
    );
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

export type City = {
  id: number;
  name: string;
  state_id: number;
  country_id: number;
};

export type State = {
  id: number;
  name: string;
  short_form: string;
  country_id: number;
  cities: City[];
};

export type StatesResponse = {
  status: true;
  message: string;
  data: { states: State[] };
};

export async function getStates(): Promise<StatesResponse> {
  try {
    const endpoint = "/get-states";
    const token = await TokenStorage.getToken();
    const headers: Record<string, unknown> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const { data } = await apiRequest<StatesResponse>({
      url: getApiUrl(endpoint),
      endpoint,
      method: "POST",
      headers,
      body: {},
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new OnboardingQueryError(
        extractApiErrorMessage(error.details.data, "Could not load states."),
        error.details.statusCode,
        error.details.data,
      );
    }
    throw new OnboardingQueryError(
      error instanceof Error ? error.message : "Could not load states.",
    );
  }
}

export type PersonalDetailsPayload = {
  first_name: string;
  last_name: string;
  gender: string;
  country: number;
  state_id: number;
  address: string;
  latitude: string;
  longitude: string;
  contact_number: string;
  date_of_birth: string;
  city: string;
  suburb: string;
  post_code: string;
  about_me: string;
  maximum_distance: number;
  accept_lower_level_job: 0 | 1;
};

export type PersonalDetailsResponse = {
  status: true;
  message: string;
  data: Hcp;
};

export async function submitPersonalDetails(
  payload: PersonalDetailsPayload,
): Promise<PersonalDetailsResponse> {
  const endpoint = "/v2/registration/personal-details";
  const token = await TokenStorage.getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const { data } = await apiRequest<PersonalDetailsResponse>({
      url: getApiUrl(endpoint),
      endpoint,
      method: "PATCH",
      headers,
      body: payload,
      timeoutMs: API_TIMEOUT,
      retryOnAndroidNetworkError: true,
    });
    return data;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      const message = extractApiErrorMessage(
        err.details.data,
        "Could not save personal details.",
      );
      if (isUnauthorizedStatus(err.details.statusCode)) {
        await notifyAuthExpired({
          message,
          statusCode: err.details.statusCode ?? 0,
        });
      }
      throw new OnboardingQueryError(
        message,
        err.details.statusCode,
        err.details.data,
      );
    }
    throw new OnboardingQueryError(
      err instanceof Error ? err.message : "Network error. Please try again.",
    );
  }
}

export type ProfessionalDetailsPayload = {
  tfn_number: string;
  registration_number: string;
  cv?: { uri: string; name: string; mimeType?: string };
};

export type ProfessionalDetailsResponse = {
  status: true;
  message: string;
  data: Hcp;
};

export async function submitProfessionalDetails(
  payload: ProfessionalDetailsPayload,
): Promise<ProfessionalDetailsResponse> {
  const endpoint = "/v2/registration/professional-details";
  const token = await TokenStorage.getToken();

  const form = new FormData();
  form.append("tfn_number", payload.tfn_number);
  form.append("registration_number", payload.registration_number);

  if (payload.cv) {
    form.append("cv", {
      uri: payload.cv.uri,
      name: payload.cv.name,
      type: payload.cv.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(getApiUrl(endpoint), {
      method: "PATCH",
      headers,
      body: form,
    });
  } catch (err) {
    throw new OnboardingQueryError(
      err instanceof Error ? err.message : "Network error. Please try again.",
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new OnboardingQueryError("Invalid response from server.");
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(
      json,
      "Could not save professional details.",
    );
    if (isUnauthorizedStatus(response.status)) {
      await notifyAuthExpired({ message, statusCode: response.status });
    }
    throw new OnboardingQueryError(message, response.status, json);
  }

  return json as ProfessionalDetailsResponse;
}

export type DocumentUploadPayload = {
  document_id: number;
  file: { uri: string; name: string; mimeType?: string };
  expiry_date?: string;
};

export type DocumentUploadResponse = {
  status: true;
  message: string;
  data: unknown;
};

export async function uploadDocument(
  payload: DocumentUploadPayload,
): Promise<DocumentUploadResponse> {
  const endpoint = "/v2/registration/documents";
  const token = await TokenStorage.getToken();

  const form = new FormData();
  form.append("document_id", String(payload.document_id));
  form.append("file", {
    uri: payload.file.uri,
    name: payload.file.name,
    type: payload.file.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
  if (payload.expiry_date) {
    form.append("expiry_date", payload.expiry_date);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      headers,
      body: form,
    });
  } catch (err) {
    throw new OnboardingQueryError(
      err instanceof Error ? err.message : "Network error. Please try again.",
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new OnboardingQueryError("Invalid response from server.");
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(json, "Could not upload document.");
    if (isUnauthorizedStatus(response.status)) {
      await notifyAuthExpired({ message, statusCode: response.status });
    }
    throw new OnboardingQueryError(message, response.status, json);
  }

  return json as DocumentUploadResponse;
}
