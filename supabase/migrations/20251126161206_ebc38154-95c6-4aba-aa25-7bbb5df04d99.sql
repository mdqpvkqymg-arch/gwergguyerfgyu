-- Drop problematic policies
DROP POLICY "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY "Users can view their own conversations" ON public.conversations;
DROP POLICY "Users can update conversations they are members of" ON public.conversations;
DROP POLICY "Users can view messages in their conversations" ON public.messages;
DROP POLICY "Users can insert messages in their conversations" ON public.messages;

-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = _conversation_id
    AND p.user_id = _user_id
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (public.is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can update conversations they are members of"
ON public.conversations
FOR UPDATE
USING (public.is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = sender_id)
  AND public.is_conversation_member(conversation_id, auth.uid())
);