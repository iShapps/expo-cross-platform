import {
    differenceInMinutes,
    format,
    isToday,
    isTomorrow,
    parseISO,
} from "date-fns";

/**
 * Format shift time range
 */
export const formatShiftTime = (startTime: string, endTime: string): string => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);

  return `${format(start, "hh:mm a")} to ${format(end, "hh:mm a")}`;
};

/**
 * Calculate duration in hours
 */
export const calculateDuration = (
  startTime: string,
  endTime: string,
): number => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  const minutes = differenceInMinutes(end, start);

  return Math.round((minutes / 60) * 100) / 100;
};

/**
 * Get time until shift starts
 */
export const getTimeUntilStart = (startTime: string): string => {
  const start = parseISO(startTime);
  const now = new Date();
  const minutes = differenceInMinutes(start, now);

  if (minutes < 0) return "Started";
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const days = Math.floor(minutes / 1440);
  return `${days} ${days === 1 ? "day" : "days"}`;
};

/**
 * Check if shift is today
 */
export const isShiftToday = (startTime: string): boolean => {
  return isToday(parseISO(startTime));
};

/**
 * Check if shift is tomorrow
 */
export const isShiftTomorrow = (startTime: string): boolean => {
  return isTomorrow(parseISO(startTime));
};

/**
 * Format shift date for display
 */
export const formatShiftDate = (startTime: string): string => {
  const date = parseISO(startTime);

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  return format(date, "MMM d, yyyy");
};

/**
 * Get shift status color
 */
export const getShiftStatusColor = (
  status: string,
): {
  background: string;
  text: string;
  badge: string;
} => {
  switch (status) {
    case "available":
      return {
        background: "#F0FFF0",
        text: "#70C601",
        badge: "#70C601",
      };
    case "scheduled":
      return {
        background: "#F0F8FF",
        text: "#4A90E2",
        badge: "#4A90E2",
      };
    case "running":
      return {
        background: "#FFF5F0",
        text: "#FF6B35",
        badge: "#FF6B35",
      };
    case "completed":
    case "pending_payment":
      return {
        background: "#FFF8E1",
        text: "#FFA500",
        badge: "#FFA500",
      };
    case "paid":
      return {
        background: "#F0FFF0",
        text: "#28A745",
        badge: "#28A745",
      };
    default:
      return {
        background: "#F5F5F5",
        text: "#666",
        badge: "#666",
      };
  }
};

/**
 * Get shift status label
 */
export const getShiftStatusLabel = (status: string): string => {
  switch (status) {
    case "available":
      return "Available";
    case "scheduled":
      return "Scheduled";
    case "running":
      return "In Progress";
    case "completed":
      return "Completed";
    case "pending_payment":
      return "Pending Payment";
    case "paid":
      return "Paid";
    default:
      return status;
  }
};

/**
 * Format address for display
 */
export const formatAddress = (shift: {
  address: string;
  city?: string;
  state?: string;
  postcode?: string;
}): string => {
  const parts = [shift.address];

  if (shift.city) parts.push(shift.city);
  if (shift.state) parts.push(shift.state);
  if (shift.postcode) parts.push(shift.postcode);

  return parts.join(", ");
};

/**
 * Check if document is expired
 */
export const isDocumentExpired = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  return parseISO(expiryDate) < new Date();
};

/**
 * Check if document is expiring soon (within 30 days)
 */
export const isDocumentExpiringSoon = (expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  const expiry = parseISO(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return expiry > now && expiry <= thirtyDaysFromNow;
};

/**
 * Get document status
 */
export const getDocumentStatus = (
  expiryDate?: string,
): "valid" | "expired" | "expiring_soon" => {
  if (!expiryDate) return "valid";
  if (isDocumentExpired(expiryDate)) return "expired";
  if (isDocumentExpiringSoon(expiryDate)) return "expiring_soon";
  return "valid";
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
};

/**
 * Calculate total hours from shifts
 */
export const calculateTotalHours = (
  shifts: { duration_hours: number }[],
): number => {
  return shifts.reduce((total, shift) => total + shift.duration_hours, 0);
};

/**
 * Group shifts by date
 */
export const groupShiftsByDate = <T extends { start_time: string }>(
  shifts: T[],
): Record<string, T[]> => {
  return shifts.reduce(
    (groups, shift) => {
      const date = format(parseISO(shift.start_time), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(shift);
      return groups;
    },
    {} as Record<string, T[]>,
  );
};

/**
 * Sort shifts by date (newest first)
 */
export const sortShiftsByDate = <T extends { start_time: string }>(
  shifts: T[],
  ascending = false,
): T[] => {
  return [...shifts].sort((a, b) => {
    const dateA = parseISO(a.start_time).getTime();
    const dateB = parseISO(b.start_time).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Filter shifts by status
 */
export const filterShiftsByStatus = <T extends { status: string }>(
  shifts: T[],
  status: string | string[],
): T[] => {
  const statuses = Array.isArray(status) ? status : [status];
  return shifts.filter((shift) => statuses.includes(shift.status));
};
