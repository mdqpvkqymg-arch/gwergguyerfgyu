-- Create storage bucket for post media (images and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-media', 'post-media', true, 52428800);

-- RLS policies for post media
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'external_video')),
  external_video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);

-- Create post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts"
ON public.posts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own posts"
ON public.posts FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Post likes policies
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Post comments policies
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments"
ON public.post_comments FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enable realtime for posts, likes, comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Add updated_at trigger for posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();