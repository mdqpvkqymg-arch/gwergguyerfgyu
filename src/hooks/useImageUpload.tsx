import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseImageUploadOptions {
  bucket: "chat-attachments" | "avatars";
  maxSizeMB?: number;
}

export const useImageUpload = ({ bucket, maxSizeMB = 5 }: UseImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return null;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be less than ${maxSizeMB}MB`);
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
