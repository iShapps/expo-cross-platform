import {
  extractApiErrorMessage,
  isUnauthorizedStatus,
  notifyAuthExpired,
} from "@/api-actions/error-utils";
import { postResource } from "@/api-actions/mutations";
import { Hcp } from "@/data-types/auth";
import {
  IChangePasswordResponse,
  IJobAvailabilityResponse,
  IPasswordChangeRequest,
  IProfileResponse,
  IShiftRatingRequest,
  IShiftTransferRequest,
  IShiftTransferResponse,
} from "@/data-types/profile";
import { TokenStorage } from "@/utils/auth-api";
import { getTenantHeaders } from "@/utils/tenant-header";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const getApiUrl = (endpoint: string) =>
  `${API_BASE_URL!.replace(/\/$/, "")}${endpoint}`;

export class ProfileQueryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ProfileQueryError";
  }
}

export async function postProfile(): Promise<IProfileResponse> {
  return postResource<{}, IProfileResponse>("/hcp/profile", {});
}

export type ProfilePersonalDetails = Pick<
  Hcp,
  | "first_name"
  | "last_name"
  | "country_id"
  | "state_id"
  | "address"
  | "latitude"
  | "longitude"
>;

export type ProfilePhotoUpdatePayload = {
  image: { uri: string; name: string; mimeType?: string };
  existing: ProfilePersonalDetails;
};

// hcp/personal-details always wants the full set of required fields, even
// when only one thing (a photo, or a single field) is actually changing —
// shared by updateProfilePhoto and updatePersonalDetails below so the
// request/error handling isn't duplicated between them.
async function postPersonalDetailsForm(
  form: FormData,
): Promise<{ status: boolean; message: string }> {
  const endpoint = "/hcp/personal-details";
  const token = await TokenStorage.getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getTenantHeaders(),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      headers,
      body: form,
    });
  } catch (err) {
    throw new ProfileQueryError(
      err instanceof Error ? err.message : "Network error. Please try again.",
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProfileQueryError("Invalid response from server.");
  }

  if (!response.ok) {
    const message = extractApiErrorMessage(json, "Could not save your details.");
    if (isUnauthorizedStatus(response.status)) {
      await notifyAuthExpired({ message, statusCode: response.status });
    }
    throw new ProfileQueryError(message, response.status, json);
  }

  return json as { status: boolean; message: string };
}

export async function updateProfilePhoto(
  payload: ProfilePhotoUpdatePayload,
): Promise<{ status: boolean; message: string }> {
  const form = new FormData();
  form.append("first_name", payload.existing.first_name);
  form.append("last_name", payload.existing.last_name);
  form.append("country", String(payload.existing.country_id));
  form.append("state", String(payload.existing.state_id));
  form.append("address", payload.existing.address);
  form.append("latitude", String(payload.existing.latitude));
  form.append("longitude", String(payload.existing.longitude));
  form.append("image", {
    uri: payload.image.uri,
    name: payload.image.name,
    type: payload.image.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  return postPersonalDetailsForm(form);
}

export type UpdatePersonalDetailsPayload = {
  first_name: string;
  last_name: string;
  // Preserved from the existing hcp record, not user-editable — there's no
  // country picker anywhere in this app (see onboarding.tsx, which hardcodes
  // country and never even sends it).
  country_id: number;
  state_id: number;
  address: string;
  latitude: string;
  longitude: string;
  city?: string;
  suburb?: string;
  post_code?: string;
  gender?: string;
  // Not declared in the backend's ValidatePersonalDetails rules, but
  // date_of_birth/contact_number are both in the Hcp model's $fillable list
  // and the controller passes the raw request body straight into a mass
  // update — so they're accepted even without a validation rule for them.
  date_of_birth?: string;
  // Only send this right after a successful hcp/verify-mobile — that OTP
  // pair only confirms the code, it never persists the number itself.
  contact_number?: string;
  maximum_distance?: number;
  image?: { uri: string; name: string; mimeType?: string };
};

export async function updatePersonalDetails(
  payload: UpdatePersonalDetailsPayload,
): Promise<{ status: boolean; message: string }> {
  const form = new FormData();
  form.append("first_name", payload.first_name);
  form.append("last_name", payload.last_name);
  form.append("country", String(payload.country_id));
  form.append("state", String(payload.state_id));
  form.append("address", payload.address);
  form.append("latitude", payload.latitude);
  form.append("longitude", payload.longitude);
  if (payload.city) form.append("city", payload.city);
  if (payload.suburb) form.append("suburb", payload.suburb);
  if (payload.post_code) form.append("post_code", payload.post_code);
  if (payload.gender) form.append("gender", payload.gender);
  if (payload.date_of_birth) {
    form.append("date_of_birth", payload.date_of_birth);
  }
  if (payload.contact_number) {
    form.append("contact_number", payload.contact_number);
  }
  if (payload.maximum_distance !== undefined) {
    form.append("maximum_distance", String(payload.maximum_distance));
  }
  if (payload.image) {
    form.append("image", {
      uri: payload.image.uri,
      name: payload.image.name,
      type: payload.image.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  return postPersonalDetailsForm(form);
}

export async function sendMobileVerification(
  contactNumber: string,
): Promise<{ status: boolean; message: string; data?: { request_token: string } }> {
  return postResource<
    { contact_number: string },
    { status: boolean; message: string; data?: { request_token: string } }
  >("/hcp/send-mobile-verification", { contact_number: contactNumber });
}

export async function verifyMobile(
  otp: string,
  requestToken: string,
): Promise<{ status: boolean; message: string }> {
  return postResource<
    { otp: string; request_token: string },
    { status: boolean; message: string }
  >("/hcp/verify-mobile", { otp, request_token: requestToken });
}

export async function updateAvailability(
  status: number,
): Promise<IJobAvailabilityResponse> {
  return postResource<{ status: number }, IJobAvailabilityResponse>(
    "/hcp/update-available-job-status",
    {
      status: status, // 1 for available, 0 for unavailable
    },
  );
}

export async function changePassword(
  request: IPasswordChangeRequest,
): Promise<IChangePasswordResponse> {
  return postResource<
    {
      current_password: string;
      new_password: string;
      new_password_again: string;
    },
    IChangePasswordResponse
  >("/hcp/change-password", {
    current_password: request.current_password,
    new_password: request.new_password,
    new_password_again: request.new_password,
  });
}

export async function transferShift(
  request: IShiftTransferRequest,
): Promise<IShiftTransferResponse> {
  return postResource<
    { shift_id: number; transfer_hcp_id: number },
    IShiftTransferResponse
  >("/shift/transfer", {
    shift_id: request.shift_id,
    transfer_hcp_id: request.transfer_hcp_id,
  });
}

export async function rateShift(
  request: IShiftRatingRequest,
): Promise<IShiftTransferResponse> {
  return postResource<
    {
      shift_id: number;
      rating: number;
      comment?: string;
      facility_id: number;
      category_id: number;
      profession_id: number;
    },
    IShiftTransferResponse
  >("/shift/give-rating", {
    shift_id: request.shift_id,
    rating: request.rating,
    comment: request.comment,
    facility_id: request.facility_id,
    category_id: request.category_id,
    profession_id: request.profession_id,
  });
}
