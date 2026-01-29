export interface PushNotification {
  id: string;
  type: string;
  created_at: string;
  is_read: boolean;
  title: string;
  message: string;
}

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
}
