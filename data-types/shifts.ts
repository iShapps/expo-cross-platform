interface IHcp {
  id: number;
  first_name: string;
  last_name: string;
  average_rating: number | null;
}

interface ICategory {
  id: number;
  name: string;
}

interface IProfession {
  id: number;
  name: string;
}

interface ILevel {
  id: number;
  name: string;
}

interface IFacility {
  id: number;
  name: string;
  facility_group_id: number | null;
  address: string;
  average_rating: number | null;
}

interface IState {
  id: number;
  name: string;
  short_form: string;
  country_id: number;
  time_zone: string;
  status: string;
  created_by: number;
  updated_by: number;
  time_zone_hours: string;
  time_zone_mints: string;
  time_zone_name: string;
}

export interface IShift {
  id: number;
  shift_prefix: string;
  facility_group_id: number | null;
  facility_id: number;
  word_wing: string;
  hcp_id: number;
  buddy_hcp_id: number | null;
  category_id: number;
  profession_id: number;
  hcp_level_id: number;
  select_date: string | null;
  is_sleepover_shift: number;
  hcp_sleepover_rate: string;
  facility_sleepover_rate: string | null;
  start_time: string;
  end_time: string;
  hcp_shift_start_time: string | null;
  hcp_shift_end_time: string | null;
  sleepover_afternoon_start_time: string | null;
  sleepover_afternoon_end_time: string | null;
  sleepover_night_start_time: string | null;
  sleepover_night_end_time: string | null;
  sleepover_start_time: string | null;
  sleepover_end_time: string | null;
  sleepover_morning_start_time: string | null;
  sleepover_morning_end_time: string | null;
  approved_shift_start_time: string | null;
  approved_shift_end_time: string | null;
  break: number;
  hours: string;
  working_hours: string;
  shift_status: string;
  cancel_by: string | null;
  cancel_time: string | null;
  cancel_reason: string | null;
  hcp_amount: string;
  facility_amount: string;
  admin_amount: string;
  admin_fees: string;
  facility_per_rate: string;
  hcp_per_rate: string;
  no_of_openings: number;
  booked_by: string;
  shift_loading: string;
  notes: string | null;
  notes_attachments: string | null;
  gender: string | null;
  shift_type: string;
  shift_transfered: string;
  shift_swapped: string;
  shift_transfer_swap_status: string | null;
  shift_time: string;
  address: string;
  shift_approved_time: string | null;
  mentor_hcp_name: string | null;
  mentor_hcp_email: string | null;
  mentor_hcp_id: number | null;
  scheduled_shift_id: number | null;
  trainee_hcp_name: string | null;
  trainee_hcp_email: string | null;
  trainee_hcp_id: number | null;
  trainee_buddy_shift_id: number | null;
  country_id: number;
  state_id: number;
  city_id: number | null;
  suburb_id: number | null;
  shift_broadcast: string;
  shift_rebroadcast_time: string | null;
  hcp_reached_at_location_notification: string;
  time_over_notification_sent: string;
  reminder_notification_sent_count: number;
  multiple_shifts: string;
  total_hours_time: string | null;
  final_hours_time: string;
  total_admin_fees_with_loading: string;
  hcp_shift_loading: string;
  hcp_shift_total_loading: string;
  facility_shift_loading: string;
  facility_shift_total_loading: string;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  approved_sleepover_afternoon_start_time: string | null;
  approved_sleepover_afternoon_end_time: string | null;
  approved_sleepover_night_start_time: string | null;
  approved_sleepover_night_end_time: string | null;
  approved_sleepover_start_time: string | null;
  approved_sleepover_end_time: string | null;
  approved_sleepover_morning_start_time: string | null;
  approved_sleepover_morning_end_time: string | null;
  sleepover_afternoon_admin_fees: string | null;
  sleepover_afternoon_loading: string | null;
  sleepover_afternoon_working_hours: string | null;
  sleepover_afternoon_faciliy_amount: string | null;
  sleepover_afternoon_hcp_amount: string | null;
  sleepover_night_admin_fees: string | null;
  sleepover_night_loading: string | null;
  sleepover_night_working_hours: string | null;
  sleepover_night_faciliy_amount: string | null;
  sleepover_night_hcp_amount: string | null;
  sleepover_morning_admin_fees: string | null;
  sleepover_morning_loading: string | null;
  sleepover_morning_working_hours: string | null;
  sleepover_morning_faciliy_amount: string | null;
  sleepover_morning_hcp_amount: string | null;
  extra_night_hours_details: string | null;
  hcp: IHcp;
  category: ICategory;
  profession: IProfession;
  level: ILevel;
  facility: IFacility;
  cancelled_shift: any | null;
  shift_transfer_from: any | null;
  shift_transfer_to: any | null;
  state: IState;
}

export interface IPaginatedShiftsResponse {
  current_page: number;
  data: IShift[];
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

export interface IShiftResponse {
  status: boolean;
  message: string;
  data: {
    shifts: IPaginatedShiftsResponse;
  };
}
