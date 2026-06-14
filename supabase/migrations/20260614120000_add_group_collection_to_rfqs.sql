-- Migration to add group collection flag to RFQs
ALTER TABLE public.rfqs
ADD COLUMN is_group_collection BOOLEAN DEFAULT false;

-- Create an index for faster filtering of group collections
CREATE INDEX IF NOT EXISTS idx_rfqs_is_group_collection ON public.rfqs(is_group_collection);
