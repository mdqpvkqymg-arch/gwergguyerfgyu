-- Drop and recreate policies with correct role targeting

-- Conversations table policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conversations they are members of"
ON public.conversations
FOR UPDATE
TO authenticated
USING (is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (is_conversation_member(id, auth.uid()));

-- Conversation members table policies
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;

CREATE POLICY "Users can add themselves to conversations"
ON public.conversation_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = conversation_members.profile_id
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (is_conversation_member(conversation_id, auth.uid()));