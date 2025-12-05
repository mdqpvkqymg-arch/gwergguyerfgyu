-- Add length constraints to messages table
ALTER TABLE public.messages
ADD CONSTRAINT message_content_length 
CHECK (char_length(content) <= 5000 AND char_length(content) >= 1);

-- Add length constraints to profiles table
ALTER TABLE public.profiles
ADD CONSTRAINT display_name_length 
CHECK (char_length(display_name) <= 50 AND char_length(display_name) >= 1);

-- Add length constraint for conversation names
ALTER TABLE public.conversations
ADD CONSTRAINT conversation_name_length 
CHECK (name IS NULL OR (char_length(name) <= 100 AND char_length(name) >= 1));