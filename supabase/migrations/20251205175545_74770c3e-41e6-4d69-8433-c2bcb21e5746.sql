-- Create updates table for announcements
CREATE TABLE public.updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Everyone can read updates
CREATE POLICY "Anyone can view updates"
ON public.updates
FOR SELECT
USING (true);

-- Only admins (Mike) can manage updates - check by display_name
CREATE POLICY "Admins can insert updates"
ON public.updates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND LOWER(display_name) = 'mike'
  )
);

CREATE POLICY "Admins can update updates"
ON public.updates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND LOWER(display_name) = 'mike'
  )
);

CREATE POLICY "Admins can delete updates"
ON public.updates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND LOWER(display_name) = 'mike'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;