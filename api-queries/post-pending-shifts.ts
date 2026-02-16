import { postResource } from "@/api-actions/mutations";
import { IShiftActionResponse, IShiftResponse } from "@/data-types/shifts";

export async function postPendingShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "available", //pending
      page,
    },
  );
}

export async function postScheduledShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "scheduled",
      page,
    },
  );
}

export async function postRunningShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shifts",
    {
      shift_status: "running",
      page,
    },
  );
}

export async function postTransferedShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "transfered",
      page,
    },
  );
}

export async function postPastShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "past",
      page,
    },
  );
}

export async function postCompletedShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "completed",
      page,
    },
  );
}

export async function postCancelledShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "cancelled",
      page,
    },
  );
}

export async function postAcceptShift(
  shift_id: number,
): Promise<IShiftActionResponse> {
  return postResource<{ shift_id: number }, IShiftActionResponse>(
    "/shift/accept",
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
