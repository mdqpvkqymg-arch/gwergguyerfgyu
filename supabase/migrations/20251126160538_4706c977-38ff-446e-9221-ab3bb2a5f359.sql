-- Make display names unique
ALTER TABLE public.profiles ADD CONSTRAINT profiles_display_name_key UNIQUE (display_name);

-- Delete existing messages (test data)
DELETE FROM public.messages;

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create conversation_members table (junction table)
CREATE TABLE public.conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, profile_id)
);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Add conversation_id to messages
ALTER TABLE public.messages ADD COLUMN conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Drop old messages RLS policies
DROP POLICY "Messages are viewable by everyone" ON public.messages;
DROP POLICY "Users can insert their own messages" ON public.messages;

-- Create new RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = conversations.id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update conversations they are members of"
ON public.conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = conversations.id
    AND p.user_id = auth.uid()
  )
);

-- Create RLS policies for conversation_members
CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = conversation_members.conversation_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to conversations"
ON public.conversation_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = conversation_members.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Create new RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = messages.conversation_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = sender_id)
  AND EXISTS (
    SELECT 1 FROM public.conversation_members cm
    INNER JOIN public.profiles p ON p.id = cm.profile_id
    WHERE cm.conversation_id = messages.conversation_id
    AND p.user_id = auth.uid()
  )
);

-- Trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for conversations and conversation_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;