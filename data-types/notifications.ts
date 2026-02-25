export type NotificationType = "documents" | "statement-details" | "shifts";

export interface INotification {
  id: number;
  notification_prefix: string;
  title: string;
  message: string;
  shift_id: number;
  hcp_id: number | null;
  facility_id: number | null;
  swap_request_id: number | null;
  statement_id: number | null;
  notification_type: NotificationType;
  shift_broadcast_type: null;
  read_status: string;
  date_time: Date;
  send_to: string;
  sent_by: null;
  statement_status: null;
  read_facilities: null;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  document_id: null;
  expiry_date: Date;
  is_expired: number;
  shift: NotificationShift;
}

export interface NotificationShift {
  id: number;
  shift_prefix: string;
  shift_type: string;
}

export interface IPaginatedNotificationsResponse {
  current_page: number;
  data: INotification[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface INotificationResponse {
  status: boolean;
  message: string;
  data: {
    hcps: IPaginatedNotificationsResponse;
  };
}

export interface NotificationAdditionalData {
  shift: NotificationShift;
  shift_id: number;
  notification_type: NotificationType;
  hcp_id: number | null;
  swap_request_id: number | null;
  document_type: string | null;
}

export interface AppNotification {
  actionButtons: any[];
  additionalData?: NotificationAdditionalData;
  attachments?: unknown;
  badge?: number;
  badgeIncrement?: number;
  body: string;
  category?: string;
  contentAvailable?: boolean;
  interruptionLevel?: string;
  launchURL?: string;
  mutableContent?: boolean;
  notificationId: string;
  rawPayload?: unknown;
  relevanceScore?: number;
  sound?: string;
  subtitle?: string;
  templateId?: string;
  templateName?: string;
  threadId?: string;
  title: string;
}
