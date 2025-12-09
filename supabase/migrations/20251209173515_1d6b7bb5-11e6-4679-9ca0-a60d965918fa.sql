-- Create follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (follower_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (follower_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;