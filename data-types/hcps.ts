export interface IPaginatetHCPsResponse {
  current_page: number;
  data: IHcp[];
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

export interface IHCPsResponse {
  status: boolean;
  message: string;
  data: {
    hcps: IPaginatetHCPsResponse;
  };
}

export interface IHcp {
  abn_number: null;
  about_me: null;
  accept_lower_level_job: number;
  account_name: null;
  account_number: null;
  address: string;
  agree_terms_and_conditions: number;
  app_registration_screen: string;
  approval_notification_sent: number;
  available_for_job: number;
  average_rating: null;
  bank_name: null;
  blocklists: any[];
  branch_name_and_address: null;
  bsb_number: null;
  buddy_shift_requests: BuddyShiftRequest[];
  city: null;
  city_id: null;
  city_name: string;
  contact_number: string;
  country: Country;
  country_id: number;
  created_at: Date;
  created_by: null;
  cv: string;
  date_of_birth: Date;
  deleted_at: null;
  first_name: string;
  gender: null;
  hcp_prefix: string;
  id: number;
  image: string;
  invitation_code: null;
  last_name: string;
  latitude: string;
  longitude: string;
  maximum_distance: null;
  next_of_kin: null;
  notes: null;
  one_hcp_professions: OneHcpProfessions;
  points: number;
  post_code: string;
  referral_code: string;
  registered_date: null;
  registration_number: null;
  shifts: any[];
  show_approved_screen: number;
  state: Country;
  state_id: number;
  status: string;
  suburb: null;
  suburb_id: null;
  suburb_name: string;
  superannuation_detail_fund_name: null;
  superannuation_detail_membership_no: null;
  tfn_number: string;
  updated_at: Date;
  updated_by: number;
  user: Country;
  user_id: number;
}

export interface BuddyShiftRequest {
  category_id: number;
  created_at: Date;
  created_by: number;
  facility_id: null;
  hcp_id: number;
  hcp_profession_id: number;
  id: number;
  level_id: null;
  profession_id: number;
  shift_id: null;
  status: string;
  updated_at: Date;
  updated_by: number;
}

export interface Country {
  id: number;
  name: string;
  sortname?: string;
  status: string;
  country_id?: number;
  email?: string;
}

export interface OneHcpProfessions {
  accept_level_ids: null;
  accept_lower_status: string;
  category: Category;
  category_id: number;
  created_at: Date;
  created_by: number;
  hcp_id: number;
  id: number;
  level: null;
  level_id: null;
  profession: Profession;
  profession_id: number;
  status: string;
  updated_at: Date;
  updated_by: number;
}

export interface Category {
  category_prefix: string;
  comments: null;
  created_at: Date;
  created_by: number;
  deleted_at: null;
  id: number;
  name: string;
  status: string;
  updated_at: Date;
  updated_by: number;
}

export interface Profession {
  admin_fees: string;
  category_id: number;
  comments: null;
  created_at: Date;
  created_by: number;
  deleted_at: null;
  facility_per_rate: string;
  has_levels: string;
  hcp_per_rate: string;
  id: number;
  mark_up: null;
  name: string;
  plan_list_order: number;
  profession_prefix: string;
  status: string;
  updated_at: Date;
  updated_by: number;
}
