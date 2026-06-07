import { postResource } from "@/api-actions/mutations";
import {
  IApprovedShiftResponse,
  IAvailableShiftResponse,
  IShiftActionResponse,
  IShiftLocationParams,
  IShiftResponse,
} from "@/data-types/shifts";
import { error } from "@/utils/logger";

// 0: pending
// 1: scheduled
// 2: running
// 3: cancelled
// 4: completed
// 5: transferred
// 6: past

// available shifts --> not assigned (uses geo fencing)
// upcoming shifts --> assigned to hcp (starting soon)

//  "upcoming" = your scheduled/active shifts;
// "available" = shifts you can apply for.
export async function postUpcomingShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "upcoming",
      page,
    },
  );
}

export async function postPendingShifts(
  page = 1,
): Promise<IAvailableShiftResponse> {
  return postResource<
    { shift_status: string; page: number },
    IAvailableShiftResponse
  >("/shift", {
    shift_status: "available", //pending
    page,
  });
}

export async function postScheduledShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "scheduled",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postRunningShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "running",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postTransferredShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "transferred",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postPastShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "past",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postCompletedShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "completed",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postCancelledShifts(
  page = 1,
  startDate?: string,
  endDate?: string,
): Promise<IShiftResponse> {
  const body: any = {
    shift_status: "cancelled",
    page,
  };
  if (startDate) body.filter_start_date = startDate;
  if (endDate) body.filter_end_date = endDate;
  return postResource("/shift", body);
}

export async function postAcceptShift(
  shift_id: number,
): Promise<IShiftActionResponse> {
  return postResource<{ shift_id: number }, IShiftActionResponse>(
    "/shift/accept",
    { shift_id },
  );
}

export async function postAcceptShiftTransfer(
  shift_id: number,
): Promise<IShiftActionResponse> {
  return postResource<{ shift_id: number }, IShiftActionResponse>(
    "/shift/accept-transfer-request",
    { shift_id },
  );
}

export async function postShiftTracking(params: {
  shift_id: number;
  facility_id: number;
  latitude: number;
  longitude: number;
}): Promise<IShiftActionResponse> {
  return postResource<typeof params, IShiftActionResponse>(
    "/shift/shift-tracking",
    params,
  );
}

export async function postStartShift(
  shift_id: number,
): Promise<IShiftActionResponse> {
  return postResource<{ shift_id: number }, IShiftActionResponse>(
    "/shift/start",
    { shift_id },
  );
}

export async function postEndShift(
  shift_id: number,
): Promise<IShiftActionResponse> {
  return postResource<{ shift_id: number }, IShiftActionResponse>(
    "/shift/end",
    { shift_id },
  );
}

export async function postShiftLocation(params: IShiftLocationParams) {
  try {
    return await postResource<IShiftLocationParams, IShiftActionResponse>(
      "/shift/shift-tracking",
      params,
    );
  } catch (err) {
    error("Failed to send shift location", err);
    throw err;
  }
}

export async function postPendingApprovalShifts(
  page = 1,
): Promise<IShiftResponse> {
  const response = await postResource<
    { shift_status: string; page: number },
    IApprovedShiftResponse
  >("/shift", {
    shift_status: "completed",
    page,
  });

  return {
    status: response.status,
    message: response.message,
    data: {
      shifts: response.data.shifts.completed_shifts,
    },
  };
}

export async function postApprovedShifts(page = 1): Promise<IShiftResponse> {
  const response = await postResource<
    { shift_status: string; page: number },
    IApprovedShiftResponse
  >("/shift", {
    shift_status: "completed",
    page,
  });

  return {
    status: response.status,
    message: response.message,
    data: {
      shifts: response.data.shifts.approved_shifts,
    },
  };
}
