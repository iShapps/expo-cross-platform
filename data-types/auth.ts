// Types
export interface LoginCredentials {
  email: string;
  password: string;
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

export interface User {
  id: number;
  facility_admin_id: number | null;
  facility_group_id: number | null;
  name: string;
  email: string;
  email_verified_at: string;
  role_name: string;
  status: string;
  last_login_at: string;
  last_login_ip: string;
  device_id: string | null;
  created_by: number;
  updated_by: number;
  device_type: string | null;
  device_name: string | null;
  device_version: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hcp?: any; // TODO: Define HCP type
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
