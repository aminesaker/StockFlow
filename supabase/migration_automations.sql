-- ============================================================
-- MIGRATION : Automatisations SaaS
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Table des préférences d'automatisation par utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Email de notification (peut être différent du compte)
  notify_email text,
  -- Automatisations
  auto_invoice        boolean DEFAULT true,   -- Facture auto quand commande livrée
  stock_alerts        boolean DEFAULT true,   -- Email quand stock bas
  overdue_reminders   boolean DEFAULT true,   -- Relances impayés
  weekly_report       boolean DEFAULT true,   -- Rapport hebdomadaire
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_select" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_settings_delete" ON user_settings FOR DELETE USING (user_id = auth.uid());

-- 2. Suivi des relances sur les factures
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_count    integer DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_at  timestamptz;

-- 3. Fonction pour créer les settings par défaut au 1er login (optionnel)
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger sur auth.users (crée les settings dès l'inscription)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_settings();
