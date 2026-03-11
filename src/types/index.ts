// ================================================
// LASAC CRM — Tipos principales
// ================================================

export type UserRole = "admin" | "manager" | "supervisor" | "vendor" | "marketing";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quoted"
  | "test_drive"
  | "negotiation"
  | "won"
  | "lost"
  | "nurturing";

export type LeadPriority = "low" | "medium" | "high";

export type SourceChannel =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "web"
  | "phone"
  | "referral"
  | "other";

export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";

export type TestDriveStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type TestDriveResult = "very_interested" | "interested" | "not_interested" | "undecided";

export type FinancingStatus = "simulated" | "submitted" | "in_review" | "approved" | "rejected";

export type TradeInStatus = "pending" | "appraised" | "approved" | "rejected";
export type TradeInCondition = "excellent" | "good" | "fair" | "poor";

export type ActivityType =
  | "note"
  | "call"
  | "whatsapp"
  | "email"
  | "meeting"
  | "status_change"
  | "quote_sent"
  | "test_drive"
  | "system";

// ------------------------------------------------
// Entidades principales
// ------------------------------------------------

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  document_number?: string;
  source_channel?: SourceChannel;
  source_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  contact_id: string;
  contact?: Contact;
  assigned_to: string;
  assigned_user?: User;
  status: LeadStatus;
  interest_model_id?: string;
  interest_model?: VehicleModel;
  has_trade_in: boolean;
  needs_financing: boolean;
  priority: LeadPriority;
  lost_reason_id?: string;
  lost_reason?: LostReason;
  lost_notes?: string;
  source_channel?: SourceChannel;
  source_campaign?: string;
  score: number;
  created_at: string;
  closed_at?: string;
  last_activity_at?: string;
}

export interface VehicleModel {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  base_price: number;
  currency: "ARS" | "USD";
  stock_count: number;
  active: boolean;
  metadata?: {
    colors?: string[];
    photos?: string[];
    description?: string;
  };
}

export interface Quote {
  id: string;
  lead_id: string;
  lead?: Lead;
  created_by: string;
  created_by_user?: User;
  approved_by?: string;
  vehicle_model_id: string;
  vehicle_model?: VehicleModel;
  color?: string;
  accessories?: { name: string; price: number }[];
  base_price: number;
  discount_pct: number;
  final_price: number;
  financing_included: boolean;
  trade_in_included: boolean;
  trade_in_value?: number;
  status: QuoteStatus;
  valid_until: string;
  pdf_url?: string;
  created_at: string;
}

export interface TestDrive {
  id: string;
  lead_id: string;
  lead?: Lead;
  vehicle_model_id: string;
  vehicle_model?: VehicleModel;
  assigned_vendor: string;
  assigned_vendor_user?: User;
  scheduled_at: string;
  duration_minutes: number;
  status: TestDriveStatus;
  result?: TestDriveResult;
  notes?: string;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
}

export interface FinancingRequest {
  id: string;
  lead_id: string;
  quote_id?: string;
  bank?: string;
  plan_name?: string;
  down_payment?: number;
  installments?: number;
  monthly_amount?: number;
  annual_rate?: number;
  status: FinancingStatus;
  rejection_reason?: string;
  approved_at?: string;
  documents?: Record<string, boolean>;
}

export interface TradeIn {
  id: string;
  lead_id: string;
  brand: string;
  model: string;
  year: number;
  kilometers: number;
  condition: TradeInCondition;
  color?: string;
  photos?: string[];
  estimated_value?: number;
  approved_value?: number;
  appraised_by?: string;
  status: TradeInStatus;
  valid_until?: string;
  notes?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  user_id?: string;
  user?: User;
  type: ActivityType;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface LostReason {
  id: string;
  label: string;
  active: boolean;
}

// ------------------------------------------------
// Pipeline / Kanban
// ------------------------------------------------

export interface PipelineColumn {
  id: LeadStatus;
  label: string;
  color: string;
  leads: Lead[];
}

// ------------------------------------------------
// Dashboard / KPIs
// ------------------------------------------------

export interface DashboardStats {
  total_leads: number;
  leads_today: number;
  leads_this_week: number;
  conversion_rate: number;
  avg_response_time_minutes: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_channel: Record<SourceChannel, number>;
  leads_by_vendor: { vendor: User; count: number; conversion: number }[];
  revenue_this_month: number;
}

// ------------------------------------------------
// Formularios
// ------------------------------------------------

export interface CreateLeadForm {
  full_name: string;
  phone: string;
  email?: string;
  source_channel: SourceChannel;
  interest_model_id?: string;
  has_trade_in: boolean;
  needs_financing: boolean;
  priority?: LeadPriority;
  notes?: string;
}

export interface CreateQuoteForm {
  lead_id: string;
  vehicle_model_id: string;
  color?: string;
  accessories?: { name: string; price: number }[];
  discount_pct: number;
  financing_included: boolean;
  trade_in_included: boolean;
  trade_in_value?: number;
  valid_days?: number;
}
