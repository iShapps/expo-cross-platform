export interface IConfigResponse {
  status: boolean;
  message: string;
  data: IConfigData;
}

export interface IConfigData {
  documents: Documents;
  image_path: ImagePath;
  configuration: IConfiguration;
  supporting_page: SupportingPage;
  dev_configuration: DevConfiguration[];
  lms: Lms;
  string_translation: StringTranslation;
}

export interface IConfiguration {
  tracking_hcp: string;
  tracking_before_start_job_in_minutes: number;
  tracking_every_minutes: number;
  shift_start_before_mint: number;
  hcp_cust_care_email: string;
  android_app_link: string;
  ios_app_link: string;
  android_app_version: string;
  ios_app_version: string;
  show_accept_lower_level_job_checkbox: number;
  show_shift_accept_popup: boolean;
  shift_accept_popup_string: string;
  show_shift_end_popup: boolean;
  shift_end_popup_string: string;
}

export interface DevConfiguration {
  id: number;
  config_key: string;
  config_value: string;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface Documents {
  current_page: number;
  data: Datum[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: null;
  path: string;
  per_page: number;
  prev_page_url: null;
  to: number;
  total: number;
}

export interface Datum {
  id: number;
  document_prefix: string;
  name: string;
  required_for: string;
  mandatory_status: string;
  expiry_date_mandatory: string;
  profession_id: null;
  doc_type: string;
  status: string;
  created_by: number | null;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}

export interface ImagePath {
  hcp_path: string;
  supporting_page_path: string;
  invoice_path: string;
  facility_path: string;
}

export interface Lms {
  id: number;
  lms_url: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface StringTranslation {
  shift_accept_popup_string: string;
  shift_end_popup_string: string;
}

export interface SupportingPage {
  id: number;
  term_condition_hcp_file: string;
  faq_hcp_file: string;
  policy_hcp_file: string;
  about_us_hcp_file: string;
  contact_us_hcp_file: string;
  term_condition_facility_link: string;
  faq_facility_link: string;
  policy_facility_link: string;
  term_condition_facility_plan: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}
