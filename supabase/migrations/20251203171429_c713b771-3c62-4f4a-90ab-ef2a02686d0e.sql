-- Drop all existing policies and recreate as PERMISSIVE

-- Conversations table
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can update conversations they are members of"
ON public.conversations
FOR UPDATE
TO authenticated
USING (is_conversation_member(id, auth.uid()));

-- Conversation members table
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;

CREATE POLICY "Users can add members to conversations"
ON public.conversation_members
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (is_conversation_member(conversation_id, auth.uid()));

-- Messages table
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  is_conversation_member(conversation_id, auth.uid()) 
  AND sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (is_conversation_member(conversation_id, auth.uid()));