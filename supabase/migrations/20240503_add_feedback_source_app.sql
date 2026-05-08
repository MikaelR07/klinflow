-- ── UPGRADE: Feedback Source Tracking ──────────────────────────────
-- Adds a source_app column to app_reviews to distinguish which app
-- and which type of user submitted the feedback.
-- Values: 'client' | 'agent_independent' | 'agent_company'

ALTER TABLE public.app_reviews
ADD COLUMN IF NOT EXISTS source_app TEXT DEFAULT 'client';

COMMENT ON COLUMN public.app_reviews.source_app IS 
'Identifies the originating app and user type: client | agent_independent | agent_company';
