-- Delivery lease for user-triggered confirmation recovery. Never stores raw bearer tokens.
alter table leads add column if not exists confirm_delivery_started_at timestamptz;
