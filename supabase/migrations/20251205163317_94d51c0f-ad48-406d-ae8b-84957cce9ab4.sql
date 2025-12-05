-- Block updates on conversation_members (membership records should be immutable)
CREATE POLICY "Block updates on conversation members"
ON public.conversation_members
FOR UPDATE
USING (false);

-- Only message sender can update their own messages
CREATE POLICY "Users can only update their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can only delete their own read receipts
CREATE POLICY "Users can delete their own read receipts"
ON public.conversation_read_receipts
FOR DELETE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));