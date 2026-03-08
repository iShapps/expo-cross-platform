import { IShift } from "@/data-types/shifts";
import { ShiftCalendarEvent } from "@/hooks/use-calendar-and-reminders";

/**
 * Convert IShift to ShiftCalendarEvent for calendar operations
 */
export const shiftToCalendarEvent = (shift: IShift): ShiftCalendarEvent => {
  // Parse start time - prefer approved time over original time
  const startTime = shift.approved_shift_start_time
    ? new Date(shift.approved_shift_start_time)
    : new Date(shift.start_time);

  // Parse end time - prefer approved time over original time
  const endTime = shift.approved_shift_end_time
    ? new Date(shift.approved_shift_end_time)
    : new Date(shift.end_time);

  // For sleepover shifts, use the sleepover times if available
  let actualStartTime = startTime;
  let actualEndTime = endTime;

  if (shift.is_sleepover_shift === 1) {
    if (shift.approved_sleepover_start_time) {
      actualStartTime = new Date(shift.approved_sleepover_start_time);
    }
    if (shift.approved_sleepover_end_time) {
      actualEndTime = new Date(shift.approved_sleepover_end_time);
    }
  }

  const profession = shift.profession?.name || "Unknown Profession";
  const facilityName = shift.facility?.name || "Unknown Facility";
  const location =
    shift.address || shift.facility?.address || "No location provided";

  // Build detailed notes with shift information
  const notes = [
    `Shift Type: ${shift.shift_type}`,
    `Ward: ${shift.word_wing}`,
    `Break: ${shift.break} minutes`,
    shift.category?.name && `Category: ${shift.category.name}`,
    shift.hcp?.first_name &&
      `Assigned to: ${shift.hcp.first_name} ${shift.hcp.last_name}`,
    shift.notes && `Additional Notes: ${shift.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    shiftId: shift.id,
    facilityName,
    profession,
    startTime: actualStartTime,
    endTime: actualEndTime,
    location,
    notes,
  };
};

/**
 * Format shift time for display
 */
export const formatShiftTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format shift date for display
 */
export const formatShiftDate = (date: Date): string => {
  return date.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get shift duration in hours
 */
export const getShiftDurationHours = (startTime: Date, endTime: Date): number => {
  const diffMs = endTime.getTime() - startTime.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Check if shift is starting soon (within next hour)
 */
export const isShiftStartingSoon = (startTime: Date): boolean => {
  const now = new Date();
  const timeDiff = startTime.getTime() - now.getTime();
  return timeDiff > 0 && timeDiff < 60 * 60 * 1000; // Less than 1 hour
};

/**
 * Check if shift is active (currently happening)
 */
export const isShiftActive = (startTime: Date, endTime: Date): boolean => {
  const now = new Date();
  return now >= startTime && now <= endTime;
};
