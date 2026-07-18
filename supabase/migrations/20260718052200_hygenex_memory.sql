CREATE TABLE IF NOT EXISTS public.hygenex_memory (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text NOT NULL,
  confidence numeric DEFAULT 1.0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.hygenex_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own memory" 
  ON public.hygenex_memory 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE public.hygenex_memory TO anon;
GRANT ALL ON TABLE public.hygenex_memory TO authenticated;
GRANT ALL ON TABLE public.hygenex_memory TO service_role;
