import type { IShiftRecipient } from "@/data-types/shifts";

type ShiftLike = {
  recipient?: IShiftRecipient | null;
  facility?: { id?: number | null; name?: string | null; address?: string | null } | null;
  client_id?: number | null;
} | null | undefined;

/**
 * Who a shift is for: a facility, or a participant (someone the agency cares
 * for at home). Read this instead of shift.facility: older API versions sent
 * facility: null for participant shifts.
 */
export function shiftRecipient(shift: ShiftLike): {
  type: "facility" | "participant";
  name: string | null;
  address: string | null;
} | null {
  if (!shift) return null;
  if (shift.recipient) {
    const r = shift.recipient;
    return {
      type: r.type,
      name: r.name || null,
      address: [r.address, r.suburb].filter(Boolean).join(", ") || null,
    };
  }
  if (!shift.facility) return null;
  return {
    type: shift.client_id ? "participant" : "facility",
    name: shift.facility.name ?? null,
    address: shift.facility.address ?? null,
  };
}

export const isParticipantShift = (shift: ShiftLike) => shiftRecipient(shift)?.type === "participant";
