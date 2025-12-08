-- Add first_name and last_name columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Update the handle_new_user function to store first/last name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  random_color TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_display_name TEXT;
BEGIN
  -- Generate a random color
  random_color := '#' || lpad(to_hex(floor(random() * 16777215)::int), 6, '0');
  
  -- Extract names from metadata
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  
  -- Build display_name from first + last, or fallback to email prefix
  IF v_first_name IS NOT NULL AND v_last_name IS NOT NULL THEN
    v_display_name := v_first_name || ' ' || v_last_name;
  ELSIF v_first_name IS NOT NULL THEN
    v_display_name := v_first_name;
  ELSE
    v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, avatar_color)
  VALUES (
    NEW.id,
    v_display_name,
    v_first_name,
    v_last_name,
    random_color
  );
  
  RETURN NEW;
END;
$function$;