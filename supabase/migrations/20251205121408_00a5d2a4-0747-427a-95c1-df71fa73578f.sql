-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view profiles in shared conversations" ON public.profiles;

-- Create a more permissive policy allowing all authenticated users to see all profiles
-- This is needed so users can find and add people to conversations
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);