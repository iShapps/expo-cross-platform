export interface IFacility {
  id: number;
  facility_prefix: string;
  user_id: number;
  name: string;
  facility_name_id: number | null;
  facility_group_id: number | null;
  legal_entity_name: string | null;
  contact_person: string | null;
  suburd: string | null;
  post_code: string | null;
  contact_number: string | null;
  mobile_number: string | null;
  additional_email: string | null;
  additional_nurse_email: string | null;
  address: string | null;
  city_name: string | null;
  suburb_name: string | null;
  state_id: number | null;
  city_id: number | null;
  country_id: number | null;
  suburb_id: number | null;
  latitude: string | null;
  longitude: string | null;
  card_number: string | null;
  card_expiry_date: string | null;
  card_cvv: string | null;
  plan_auto_renewal: boolean | null;
  stripe_customer_id: string | null;
  status: "active" | "inactive" | string;
  registered_date: string | null;
  term_condition_accept: number | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  average_rating: number | null;

  country: ICountry | null;
  state: IState | null;
  city: ICity | null;
  suburb: ISuburb | null;
  facility_name: string;
}

export interface ICountry {
  id: number;
  sortname: string;
  name: string;
  country_code: string;
  status: string;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ISuburb {
  id: number;
  name: string;
}

export interface IState {
  id: number;
  name: string;
  short_form: string;
  country_id: number;
  time_zone: string;
  status: string;
  created_by: number | null;
  updated_by: number | null;
  time_zone_hours: string | null;
  time_zone_mints: string | null;
  time_zone_name: string | null;
}

export interface IPaginatedFacilitiesResponse {
  current_page: number;
  data: IFacility[];
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

export interface ICity {
  id: number;
  name: string;
}

export interface IFacilityResponse {
  status: boolean;
  message: string;
  data: {
    facilities: IFacility[];
  };
}
