-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create a new, simpler policy that explicitly checks authentication
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Grant INSERT permission to authenticated users
GRANT INSERT ON public.conversations TO authenticated;