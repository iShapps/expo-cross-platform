import { postResource } from "@/api-actions/mutations";
import { IShiftResponse } from "@/data-types/shifts";

export async function postPendingShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "pending",
  });
}

export async function postScheduledShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "scheduled",
  });
}

export async function postRunningShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shifts", {
    shift_status: "running",
  });
}

export async function postTransferedShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "transfered",
  });
}

export async function postPastShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "past",
  });
}

export async function postCompletedShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "completed",
  });
}

export async function postCancelledShifts(): Promise<IShiftResponse> {
  return postResource<{ shift_status: string }, IShiftResponse>("/shift", {
    shift_status: "cancelled",
  });
}
