-- Create game_scores table for leaderboard
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'minesweeper', 'reaction')),
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster leaderboard queries
CREATE INDEX idx_game_scores_game_type_score ON public.game_scores (game_type, score DESC);
CREATE INDEX idx_game_scores_profile_id ON public.game_scores (profile_id);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view scores (public leaderboard)
CREATE POLICY "Anyone can view game scores"
ON public.game_scores
FOR SELECT
USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
ON public.game_scores
FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own scores
CREATE POLICY "Users can delete their own scores"
ON public.game_scores
FOR DELETE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;