-- Import initial du catalogue Shopify : token API Admin (read-only) par boutique.
alter table stores add column if not exists access_token text;
comment on column stores.access_token is 'Token API Admin (read-only) de la plateforme — utilisé pour l''import initial du catalogue (ex. Shopify shpat_...).';
