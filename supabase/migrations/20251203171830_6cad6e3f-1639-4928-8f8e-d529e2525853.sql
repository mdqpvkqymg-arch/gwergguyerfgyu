-- Create a function to handle conversation creation atomically
CREATE OR REPLACE FUNCTION public.create_conversation(
  p_member_ids uuid[],
  p_is_group boolean DEFAULT false,
  p_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_current_profile_id uuid;
  v_member_id uuid;
BEGIN
  -- Get the current user's profile ID
  SELECT id INTO v_current_profile_id
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF v_current_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Create the conversation
  INSERT INTO conversations (name, is_group)
  VALUES (p_name, p_is_group)
  RETURNING id INTO v_conversation_id;

  -- Add the current user as a member
  INSERT INTO conversation_members (conversation_id, profile_id)
  VALUES (v_conversation_id, v_current_profile_id);

  -- Add other members
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    IF v_member_id != v_current_profile_id THEN
      INSERT INTO conversation_members (conversation_id, profile_id)
      VALUES (v_conversation_id, v_member_id);
    END IF;
  END LOOP;

  RETURN v_conversation_id;
END;
$$;