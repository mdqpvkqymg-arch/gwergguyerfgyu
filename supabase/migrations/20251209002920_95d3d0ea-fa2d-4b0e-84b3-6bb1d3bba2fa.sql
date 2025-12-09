-- Add media_type column to messages for distinguishing images from videos
ALTER TABLE public.messages ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video'));