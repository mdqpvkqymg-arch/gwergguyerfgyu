-- Create table to track when users last read each conversation
CREATE TABLE public.conversation_read_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.conversation_read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view their own read receipts
CREATE POLICY "Users can view their own read receipts"
ON public.conversation_read_receipts
FOR SELECT
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can upsert their own read receipts
CREATE POLICY "Users can upsert their own read receipts"
ON public.conversation_read_receipts
FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own read receipts"
ON public.conversation_read_receipts
FOR UPDATE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_read_receipts;