export interface IProfileResponse {
  status: boolean;
  message: string;
  data: {
    hcp: IProfileHcp;
  };
}

export interface IChangePasswordResponse {
  status: boolean;
  message: string;
}

export interface IChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface IProfileHcp {
  id: number;
  hcp_prefix: string;
  user_id: number;
  image: string | null;
  first_name: string;
  last_name: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  registration_number: string;
  abn_number: string | null;
  tfn_number: string;
  invitation_code: string | null;
  address: string;
  city_name: string;
  suburb_name: string;
  state_id: number;
  city_id: number | null;
  country_id: number;
  post_code: string;
  latitude: string;
  longitude: string;
  maximum_distance: number;
  agree_terms_and_conditions: number;
  status: string;
  points: number;
  notes: string | null;
  cv: string | null;
  referral_code: string;
  app_registration_screen: string;
  registered_date: string | null;
  available_for_job: number;
  accept_lower_level_job: number;
  bank_name: string | null;
  branch_name_and_address: string | null;
  account_name: string | null;
  account_number: string | null;
  bsb_number: string | null;
  superannuation_detail_fund_name: string | null;
  superannuation_detail_membership_no: string | null;
  approval_notification_sent: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  about_me: string | null;
  suburb_id: number | null;
  show_approved_screen: number;
  next_of_kin: string | null;
  hcp_block_times_count: number;
  average_rating: number | null;
  user: IProfileUser;
  country: IProfileCountry;
  state: IProfileState;
  city: IProfileCity | null;
  suburb: IProfileSuburb | null;
  documents: IProfileDocument[];
  hcp_block_times: HcpBlockTime[];
  hcp_professions: HcpProfession[];
}

export interface IProfileUser {
  id: number;
  facility_admin_id: number | null;
  facility_group_id: number | null;
  name: string;
  email: string;
  email_verified_at: string | null;
  role_name: string;
  status: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  device_id: string | null;
  created_by: number;
  updated_by: number;
  device_type: string | null;
  device_name: string | null;
  device_version: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileCountry {
  id: number;
  sortname: string;
  name: string;
  country_code: string;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileState {
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

export interface IProfileCity {
  id: number;
  name: string;
  state_id: number;
  country_id: number;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileSuburb {
  id: number;
  name: string;
  city_id: number;
  state_id: number;
  country_id: number;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileDocument {
  id: number;
  document_prefix: string;
  name: string;
  required_for: string;
  mandatory_status: string;
  expiry_date_mandatory: string;
  profession_id: number | null;
  doc_type: string;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  expiry_date?: string;
  pivot: {
    hcp_id: number;
    document_id: number;
  };
}

export interface HcpBlockTime {
  // Assuming empty object for now based on JSON
  [key: string]: any;
}

export interface HcpProfession {
  id: number;
  hcp_id: number;
  category_id: number;
  profession_id: number;
  level_id: number;
  accept_level_ids: string;
  accept_lower_status: string;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  buddy_shift_request_count: number;
  profession: IProfileProfession;
  category: IProfileCategory;
  level: IProfileLevel;
}

export interface IProfileProfession {
  id: number;
  profession_prefix: string;
  name: string;
  comments: string | null;
  category_id: number;
  has_levels: string;
  hcp_per_rate: string | null;
  mark_up: string | null;
  facility_per_rate: string | null;
  admin_fees: string | null;
  plan_list_order: number | null;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileCategory {
  id: number;
  category_prefix: string;
  name: string;
  comments: string | null;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IProfileLevel {
  id: number;
  level_prefix: string;
  name: string;
  comments: string | null;
  category_id: number;
  profession_id: number;
  hcp_per_rate: string;
  mark_up: string;
  facility_per_rate: string;
  admin_fees: string;
  level_order: number;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IJobAvailabilityResponse {
  status: boolean;
  message: string;
  data: null;
}

export interface IPasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface IChangePasswordResponse {
  status: boolean;
  message: string;
  data: null;
  errors?: Record<string, string[]> | string[];
}
