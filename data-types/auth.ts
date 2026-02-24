// Types
export default interface LoginCredentials {
  email: string;
  password: string;

  // optionals
  device_version?: string;
  device_name?: string;
  device_type?: string;
  device_id?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface LoginSuccessResponse {
  status: true;
  message: string;
  data: {
    access_token: string;
    user: User;
  };
}

export interface LoginErrorResponse {
  status: false;
  message: string;
  data: null;
  errors?: {
    [key: string]: string[];
  };
}

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

// Forgot Password Response Types
export interface ForgotPasswordSuccessResponse {
  status: true;
  message: string;
  data: {
    email: string;
    otp_sent: boolean;
  } | null;
}

export interface ForgotPasswordErrorResponse {
  status: false;
  message: string;
  data: null;
  errors?: {
    [key: string]: string[];
  };
}

export interface VerifyOTPSuccessResponse {
  status: true;
  message: string;
  data: {
    email: string;
    otp_verified: boolean;
  } | null;
}

export interface VerifyOTPErrorResponse {
  status: false;
  message: string;
  data: null;
  errors?: {
    [key: string]: string[];
  };
}

export interface ResetPasswordSuccessResponse {
  status: true;
  message: string;
  data: {
    email: string;
    password_reset: boolean;
  } | null;
}

export interface ResetPasswordErrorResponse {
  status: false;
  message: string;
  data: null;
  errors?: {
    [key: string]: string[];
  };
}

export interface User {
  id: number;
  facility_admin_id: null;
  facility_group_id: null;
  name: string;
  email: string;
  email_verified_at: Date;
  role_name: string;
  status: string;
  last_login_at: Date;
  last_login_ip: string;
  device_id: null;
  created_by: number;
  updated_by: number;
  device_type: null;
  device_name: null;
  device_version: null;
  created_at: Date;
  updated_at: Date;
  deleted_at: null;
  hcp: Hcp;
}

export interface Hcp {
  id: number;
  hcp_prefix: string;
  user_id: number;
  image: null;
  first_name: string;
  last_name: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  registration_number: string;
  abn_number: null;
  tfn_number: string;
  invitation_code: null;
  address: string;
  city_name: string;
  suburb_name: string;
  state_id: number;
  city_id: null;
  country_id: number;
  post_code: string;
  latitude: string;
  longitude: string;
  maximum_distance: number;
  agree_terms_and_conditions: number;
  status: string;
  points: number;
  notes: null;
  cv: null;
  referral_code: string;
  app_registration_screen: string;
  registered_date: null;
  available_for_job: number;
  accept_lower_level_job: number;
  bank_name: null;
  branch_name_and_address: null;
  account_name: null;
  account_number: null;
  bsb_number: null;
  superannuation_detail_fund_name: null;
  superannuation_detail_membership_no: null;
  approval_notification_sent: number;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: null;
  about_me: null;
  suburb_id: null;
  show_approved_screen: number;
  next_of_kin: null;
  average_rating: null;
  hcp_professions: HcpProfession[];
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
  created_at: Date;
  updated_at: Date;
  profession: Level;
  category: Category;
  level: Level;
}

export interface Category {
  id: number;
  category_prefix: string;
  name: string;
  comments: null;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: null;
}

export interface Level {
  id: number;
  level_prefix?: string;
  name: string;
  comments: null;
  category_id: number;
  profession_id?: number;
  hcp_per_rate: null | string;
  mark_up: null | string;
  facility_per_rate: null | string;
  admin_fees: null | string;
  level_order?: number;
  status: string;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: null;
  profession_prefix?: string;
  has_levels?: string;
  plan_list_order?: number;
}
