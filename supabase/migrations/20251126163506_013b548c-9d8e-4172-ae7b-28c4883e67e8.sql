-- Fix profiles table security - restrict visibility to shared conversations only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create function to check if two users share any conversation
CREATE OR REPLACE FUNCTION public.shares_conversation_with(_profile_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_members cm1
    INNER JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    INNER JOIN public.profiles p ON p.id = cm2.profile_id
    WHERE cm1.profile_id = _profile_id
    AND p.user_id = _user_id
  )
$$;

-- Create restricted profile visibility policy
CREATE POLICY "Users can view profiles in shared conversations"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id  -- Always see own profile
  OR public.shares_conversation_with(id, auth.uid())  -- Or profiles of users in shared conversations
);