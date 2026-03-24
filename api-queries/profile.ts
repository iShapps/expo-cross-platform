import { postResource } from "@/api-actions/mutations";
import {
  IChangePasswordResponse,
  IJobAvailabilityResponse,
  IPasswordChangeRequest,
  IProfileResponse,
  IShiftRatingRequest,
  IShiftTransferRequest,
  IShiftTransferResponse,
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
