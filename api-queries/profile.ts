import { postResource } from "@/api-actions/mutations";
import {
  IChangePasswordResponse,
  IJobAvailabilityResponse,
  IPasswordChangeRequest,
  IProfileResponse,
} from "@/data-types/profile";

export async function postProfile(): Promise<IProfileResponse> {
  return postResource<{}, IProfileResponse>("/hcp/profile", {});
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
