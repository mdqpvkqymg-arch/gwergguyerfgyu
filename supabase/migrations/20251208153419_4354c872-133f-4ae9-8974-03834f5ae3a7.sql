-- Create function to check for banned words in display names
CREATE OR REPLACE FUNCTION public.check_banned_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(NEW.display_name) LIKE '%zimo%' THEN
    RAISE EXCEPTION 'This display name is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to profiles table
CREATE TRIGGER check_banned_display_name_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_banned_display_name();

-- Update message insert policy to also block users with banned names
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  is_conversation_member(conversation_id, auth.uid()) 
  AND (sender_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
  AND ((conversation_id <> '00000000-0000-0000-0000-000000000001'::uuid) OR (sender_id = '8bb5d56c-a59e-4e5e-a12e-09c9dfe542f5'::uuid))
  AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND lower(profiles.display_name) LIKE '%zimo%'
  )
);