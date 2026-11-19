export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string | null;
  live_url: string | null;
  github_url: string | null;
  thumbnail_url: string | null;
  images: string[];
  tech_stack: string[];
  category: string;
  year: string;
  featured: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
  status_tag?: string | null;
  role?: string | null;
}

export type ContactMessageStatus = 'new' | 'read' | 'replied';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip_hash: string;
  status: ContactMessageStatus;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar_url: string | null;
  approved: boolean;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string | null;
  source?: string | null;
  consent?: boolean;
  consent_text?: string | null;
  created_at: string;
}

export interface PageView {
  id: string;
  path: string;
  referrer: string;
  country: string;
  device: string;
  created_at: string;
}

export interface ChatLog {
  id: string;
  question: string;
  answer: string;
  ip_hash: string;
  created_at: string;
}

export interface AvailabilitySetting {
  enabled: boolean;
  text: string;
}

export interface HeroSetting {
  headline: string;
}

export interface SiteSettingsMap {
  availability: AvailabilitySetting;
  hero: HeroSetting;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
}
