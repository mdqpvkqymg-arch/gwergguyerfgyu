-- Fix conversation creation policy to match other policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create policy that works with auth.uid() check
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);