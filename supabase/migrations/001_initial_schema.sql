-- ================================================
-- LASAC CRM — Schema inicial
-- Correr en: Supabase > SQL Editor
-- ================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda fuzzy

-- ------------------------------------------------
-- ENUMS
-- ------------------------------------------------

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'vendor', 'marketing');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'quoted', 'test_drive', 'negotiation', 'won', 'lost', 'nurturing');
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE source_channel AS ENUM ('whatsapp', 'facebook', 'instagram', 'web', 'phone', 'referral', 'other');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE test_drive_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE test_drive_result AS ENUM ('very_interested', 'interested', 'not_interested', 'undecided');
CREATE TYPE financing_status AS ENUM ('simulated', 'submitted', 'in_review', 'approved', 'rejected');
CREATE TYPE trade_in_status AS ENUM ('pending', 'appraised', 'approved', 'rejected');
CREATE TYPE trade_in_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE activity_type AS ENUM ('note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'quote_sent', 'test_drive', 'system');
CREATE TYPE currency_type AS ENUM ('ARS', 'USD');
CREATE TYPE payment_method AS ENUM ('cash', 'financing', 'mixed');
CREATE TYPE delivery_status AS ENUM ('pending', 'scheduled', 'completed');
CREATE TYPE conv_channel AS ENUM ('whatsapp', 'facebook', 'instagram', 'web');
CREATE TYPE conv_status AS ENUM ('open', 'pending', 'resolved');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_sender_type AS ENUM ('lead', 'user', 'bot');
CREATE TYPE message_type AS ENUM ('text', 'image', 'document', 'audio', 'template');

-- ------------------------------------------------
-- TABLA: users (perfiles — se enlaza con auth.users)
-- ------------------------------------------------

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role user_role NOT NULL DEFAULT 'vendor',
  active BOOLEAN NOT NULL DEFAULT true,
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: vehicle_models (catálogo de vehículos)
-- ------------------------------------------------

CREATE TABLE public.vehicle_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand VARCHAR(100) NOT NULL DEFAULT 'FIAT',
  model VARCHAR(100) NOT NULL,
  version VARCHAR(100),
  year INTEGER NOT NULL,
  base_price DECIMAL(14,2),
  currency currency_type NOT NULL DEFAULT 'ARS',
  stock_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: lost_reasons (motivos de pérdida)
-- ------------------------------------------------

CREATE TABLE public.lost_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- ------------------------------------------------
-- TABLA: contacts
-- ------------------------------------------------

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  document_number VARCHAR(50),
  source_channel source_channel,
  source_campaign VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contacts_phone_unique UNIQUE (phone)
);

-- ------------------------------------------------
-- TABLA: leads
-- ------------------------------------------------

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status lead_status NOT NULL DEFAULT 'new',
  interest_model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,
  has_trade_in BOOLEAN NOT NULL DEFAULT false,
  needs_financing BOOLEAN NOT NULL DEFAULT false,
  priority lead_priority NOT NULL DEFAULT 'medium',
  lost_reason_id UUID REFERENCES lost_reasons(id) ON DELETE SET NULL,
  lost_notes TEXT,
  source_channel source_channel,
  source_campaign VARCHAR(255),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ------------------------------------------------
-- TABLA: activities (timeline del lead)
-- ------------------------------------------------

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: quotes (cotizaciones)
-- ------------------------------------------------

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE RESTRICT,
  color VARCHAR(100),
  accessories JSONB DEFAULT '[]',
  base_price DECIMAL(14,2) NOT NULL,
  discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  final_price DECIMAL(14,2) NOT NULL,
  financing_included BOOLEAN NOT NULL DEFAULT false,
  trade_in_included BOOLEAN NOT NULL DEFAULT false,
  trade_in_value DECIMAL(14,2),
  status quote_status NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMPTZ NOT NULL,
  pdf_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: test_drives
-- ------------------------------------------------

CREATE TABLE public.test_drives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  vehicle_model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE RESTRICT,
  assigned_vendor UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status test_drive_status NOT NULL DEFAULT 'scheduled',
  result test_drive_result,
  notes TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_2h_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: financing_requests
-- ------------------------------------------------

CREATE TABLE public.financing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  bank VARCHAR(100),
  plan_name VARCHAR(255),
  down_payment DECIMAL(14,2),
  installments INTEGER,
  monthly_amount DECIMAL(14,2),
  annual_rate DECIMAL(5,2),
  status financing_status NOT NULL DEFAULT 'simulated',
  rejection_reason TEXT,
  documents JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: trade_ins (toma de usados)
-- ------------------------------------------------

CREATE TABLE public.trade_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  kilometers INTEGER NOT NULL,
  condition trade_in_condition NOT NULL DEFAULT 'good',
  color VARCHAR(100),
  photos JSONB DEFAULT '[]',
  estimated_value DECIMAL(14,2),
  approved_value DECIMAL(14,2),
  appraised_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status trade_in_status NOT NULL DEFAULT 'pending',
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: sales (ventas cerradas)
-- ------------------------------------------------

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  vehicle_model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE RESTRICT,
  final_price DECIMAL(14,2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  delivery_date TIMESTAMPTZ,
  delivery_status delivery_status NOT NULL DEFAULT 'pending',
  nps_sent BOOLEAN NOT NULL DEFAULT false,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  nps_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- TABLA: conversations (inbox omnicanal)
-- ------------------------------------------------

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel conv_channel NOT NULL,
  external_chat_id VARCHAR(255),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status conv_status NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_external_unique UNIQUE (channel, external_chat_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender_type message_sender_type NOT NULL,
  sender_id UUID,
  content TEXT,
  message_type message_type NOT NULL DEFAULT 'text',
  media_url VARCHAR(500),
  external_message_id VARCHAR(255),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_last_activity ON leads(last_activity_at DESC);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_name ON contacts USING gin(full_name gin_trgm_ops);

-- ------------------------------------------------
-- TRIGGER: updated_at automático
-- ------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_models FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON test_drives FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON financing_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON trade_ins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: actualizar last_activity_at en leads
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET last_activity_at = NOW() WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_activity_updated
  AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();

-- ------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

-- Política base: usuarios autenticados ven todo (refinar por rol más adelante)
CREATE POLICY "Authenticated users can read" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.leads FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.contacts FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.quotes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.vehicle_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.test_drives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.test_drives FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.test_drives FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.trade_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.trade_ins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.trade_ins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.financing_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.financing_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.financing_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can read" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.conversations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------
-- DATOS INICIALES
-- ------------------------------------------------

-- Modelos Fiat actuales
INSERT INTO vehicle_models (brand, model, version, year, base_price, currency, stock_count) VALUES
  ('FIAT', 'Cronos', 'Like 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Cronos', 'Drive 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Cronos', 'GSE 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Pulse', 'Drive 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Pulse', 'Abarth 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Fastback', 'Impetus 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Fastback', 'Abarth 1.3', 2024, 0, 'ARS', 0),
  ('FIAT', 'Strada', 'Endurance CD', 2024, 0, 'ARS', 0),
  ('FIAT', 'Strada', 'Volcano CD', 2024, 0, 'ARS', 0),
  ('FIAT', 'Scudo', 'Furgon', 2024, 0, 'ARS', 0),
  ('FIAT', 'Ducato', 'Furgon', 2024, 0, 'ARS', 0);

-- Motivos de pérdida
INSERT INTO lost_reasons (label, sort_order) VALUES
  ('Precio fuera de presupuesto', 1),
  ('Compró otra marca', 2),
  ('Compró en otro concesionario', 3),
  ('No consiguió financiación', 4),
  ('Postergó la compra', 5),
  ('No tenía stock del modelo', 6),
  ('No calificó para crédito', 7),
  ('Sin respuesta / no localizable', 8),
  ('Otro motivo', 9);
