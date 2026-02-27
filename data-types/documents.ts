export interface IDocument {
  id: number;
  document_id: number;
  hcp_id: number;
  profession_id: number;
  level_id: number;
  document_name: string;
  start_date: string;
  expiry_date: string;
  send_notification_date: string;
  document_approval: string;
  show_in_document_approval: string;
  show_in_notification: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  profession: null;
  level: null;
  document: IDocumentDetails;
}

export interface IDocumentDetails {
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
}

export interface IPaginatedDocumentsResponse {
  current_page: number;
  data: IDocument[];
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

export interface IDocumentsResponse {
  status: boolean;
  message: string;
  data: {
    hcps: IPaginatedDocumentsResponse;
  };
}
