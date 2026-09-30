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

export async function updateProfilePhoto(
  payload: ProfilePhotoUpdatePayload,
): Promise<{ status: boolean; message: string }> {
  const endpoint = "/hcp/personal-details";
  const token = await TokenStorage.getToken();

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
    const message = extractApiErrorMessage(
      json,
      "Could not update your photo.",
    );
    if (isUnauthorizedStatus(response.status)) {
      await notifyAuthExpired({ message, statusCode: response.status });
    }
    throw new ProfileQueryError(message, response.status, json);
  }

  return json as { status: boolean; message: string };
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
