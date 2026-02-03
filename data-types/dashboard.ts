export type NotificationType =
  | "shift_available"
  | "shift_reminder"
  | "payment"
  | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  title: string;
  message: string;
}

export type PushNotification = Notification;

export interface Payrun {
  id: string;
  facility_id: string;
  facility_name: string;
  category_id: string;
  category_name: string;
  period_start: string;
  period_end: string;
  status: string;
  location: string;
  total_hours: number;
  total_amount: number;
  shift_type: string;
}

export interface DashboardMessages {
  point_message: string | null;
  referral_and_earn: string | null;
}

export interface DashboardData {
  shift: unknown | null;
  available_shifts: number;
  upcoming_shifts: number;
  scheduled_shifts: number;
  current_fortnight: number;
  current_week: number;
  current_year: number;
  hcp_current_point: number;
  hcp_messages: DashboardMessages;
  fortnight_start_date: string | null;
  fortnight_end_date: string | null;
  week_start_date: string | null;
  week_end_date: string | null;
  pending_profession_documents: unknown[];
}

export interface DashboardResponse {
  status: boolean;
  message: string;
  data: DashboardData;
}
