-- Add DELETE policy for conversations (members can delete)
CREATE POLICY "Members can delete conversations"
ON public.conversations
FOR DELETE
USING (is_conversation_member(id, auth.uid()));

-- Add DELETE policy for conversation_members
CREATE POLICY "Members can delete conversation membership"
ON public.conversation_members
FOR DELETE
USING (is_conversation_member(conversation_id, auth.uid()));

-- Add DELETE policy for messages
CREATE POLICY "Members can delete messages in their conversations"
ON public.messages
FOR DELETE
USING (is_conversation_member(conversation_id, auth.uid()));

-- Add DELETE cascade for conversation_members when conversation is deleted
ALTER TABLE public.conversation_members
DROP CONSTRAINT IF EXISTS conversation_members_conversation_id_fkey;

ALTER TABLE public.conversation_members
ADD CONSTRAINT conversation_members_conversation_id_fkey
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add DELETE cascade for messages when conversation is deleted
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add DELETE cascade for read receipts when conversation is deleted
ALTER TABLE public.conversation_read_receipts
DROP CONSTRAINT IF EXISTS conversation_read_receipts_conversation_id_fkey;

ALTER TABLE public.conversation_read_receipts
ADD CONSTRAINT conversation_read_receipts_conversation_id_fkey
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;