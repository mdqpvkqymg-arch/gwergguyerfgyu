-- Drop existing policy for sending messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create new policy that restricts updates chat to mike only
CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  is_conversation_member(conversation_id, auth.uid()) 
  AND sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND (
    -- If it's the updates conversation, only mike can send
    conversation_id != '00000000-0000-0000-0000-000000000001'
    OR sender_id = '8bb5d56c-a59e-4e5e-a12e-09c9dfe542f5'
  )
);