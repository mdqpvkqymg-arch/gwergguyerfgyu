-- Function to add members to an existing group conversation
CREATE OR REPLACE FUNCTION public.add_conversation_members(
  p_conversation_id uuid,
  p_member_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_profile_id uuid;
  v_is_group boolean;
  v_member_id uuid;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO v_current_profile_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF v_current_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if conversation is a group
  SELECT is_group INTO v_is_group
  FROM conversations
  WHERE id = p_conversation_id;
  
  IF NOT v_is_group THEN
    RAISE EXCEPTION 'Can only add members to group conversations';
  END IF;

  -- Check if current user is a member
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = p_conversation_id 
    AND profile_id = v_current_profile_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this conversation';
  END IF;

  -- Add new members (skip if already member)
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    INSERT INTO conversation_members (conversation_id, profile_id)
    VALUES (p_conversation_id, v_member_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;