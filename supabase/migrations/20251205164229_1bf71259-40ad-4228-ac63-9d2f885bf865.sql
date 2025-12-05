-- Create a function to check message rate limiting
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_count INTEGER;
  cooldown_violation BOOLEAN;
BEGIN
  -- Check messages in the last 10 seconds (max 5 messages)
  SELECT COUNT(*) INTO message_count
  FROM messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '10 seconds';

  IF message_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many messages in short time';
  END IF;

  -- Check for cooldown (1 second between messages)
  SELECT EXISTS (
    SELECT 1 FROM messages
    WHERE sender_id = NEW.sender_id
      AND created_at > NOW() - INTERVAL '1 second'
  ) INTO cooldown_violation;

  IF cooldown_violation THEN
    RAISE EXCEPTION 'Rate limit exceeded: please wait before sending another message';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce rate limiting on message inserts
CREATE TRIGGER enforce_message_rate_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_rate_limit();

-- Add index to improve rate limit query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON public.messages (sender_id, created_at DESC);