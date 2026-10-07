export interface InquiryStringsSettings {
  // 1. Studio Contact Information (shown in Contact Section & Footer Inquiries)
  location_title?: string;
  location_address?: string;
  location_subtext?: string;

  phone_title?: string;
  phone_number?: string;
  phone_subtext?: string;

  email_title?: string;
  email_address?: string;
  email_subtext?: string;

  hours_title?: string;
  hours_schedule?: string;
  hours_subtext?: string;

  consultation_notice?: string;

  // 2. Public Inquiry Section Headings
  section_subtitle?: string;
  section_title?: string;
  section_description?: string;
  studio_brand_name?: string;
  studio_brand_tagline?: string;

  // 3. Form & Feedback Strings
  form_submit_button?: string;
  form_success_message?: string;

  // 4. Default Reply Email Template
  reply_subject_template?: string;
  reply_body_template?: string;
}

export interface SocialSettings {
  id?: number;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  threads_url: string;
  pinterest_url: string;
  show_facebook?: boolean;
  show_instagram?: boolean;
  show_linkedin?: boolean;
  show_threads?: boolean;
  show_pinterest?: boolean;
  inquiry_settings?: InquiryStringsSettings;
  hero_rotation_speed?: number;
  created_at?: string;
  updated_at?: string;
}
