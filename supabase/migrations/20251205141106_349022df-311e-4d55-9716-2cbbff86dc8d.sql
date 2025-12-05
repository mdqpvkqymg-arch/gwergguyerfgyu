-- Drop the overly permissive INSERT policy on conversation_members
DROP POLICY IF EXISTS "Users can add members to conversations" ON conversation_members;

-- Create a restrictive policy that blocks direct inserts
-- All member additions must go through SECURITY DEFINER functions (create_conversation, add_conversation_members)
CREATE POLICY "Block direct member inserts - use RPC functions"
ON conversation_members FOR INSERT
WITH CHECK (false);