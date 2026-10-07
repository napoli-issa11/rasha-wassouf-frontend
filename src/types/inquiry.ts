export interface ProjectInquiry {
  id: number;
  full_name: string;
  email: string;
  telephone: string | null;
  project_category: string;
  project_vision: string;
  status: 'new' | 'in_review' | 'contacted' | 'archived';
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface InquiryFormData {
  full_name?: string;
  name?: string;
  email: string;
  telephone?: string;
  phone?: string;
  project_category?: string;
  projectType?: string;
  project_vision?: string;
  message?: string;
}

export interface InquiryApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: ProjectInquiry;
  errors?: Record<string, string[]>;
}
