import { postResource } from "@/api-actions/mutations";
import { IShiftResponse } from "@/data-types/shifts";

export async function postPendingShifts(page = 1): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "pending",
      page,
    },
  );
}

export async function postScheduledShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "scheduled",
      page,
    },
  );
}

export async function postRunningShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shifts",
    {
      shift_status: "running",
      page,
    },
  );
}

export async function postTransferedShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "transfered",
      page,
    },
  );
}

export async function postPastShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "past",
      page,
    },
  );
}

export async function postCompletedShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "completed",
      page,
    },
  );
}

export async function postCancelledShifts(
  page = 1,
): Promise<IShiftResponse> {
  return postResource<{ shift_status: string; page: number }, IShiftResponse>(
    "/shift",
    {
      shift_status: "cancelled",
      page,
    },
  );
}
