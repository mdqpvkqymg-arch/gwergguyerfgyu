-- Fix conversation creation RLS policy
-- Drop and recreate the INSERT policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create a proper INSERT policy for authenticated users
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);