-- ============================================================
-- MIGRATION : Clés API publique
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,          -- Nom lisible (ex: "WooCommerce boutique")
  key_prefix  text NOT NULL,          -- 8 premiers chars affichés dans l'UI
  key_hash    text NOT NULL UNIQUE,   -- SHA-256 du token complet (jamais stocké en clair)
  last_used_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id  ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select" ON api_keys FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE USING (user_id = auth.uid());
