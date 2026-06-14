-- Intégration Google Sheets : onglet à synchroniser par boutique.
-- (domain réutilisé pour l'URL du Sheet ; platform='google_sheets')
alter table stores add column if not exists sheet_tab text;
comment on column stores.sheet_tab is 'Onglet (feuille) du Google Sheet à synchroniser. Null = première feuille.';
