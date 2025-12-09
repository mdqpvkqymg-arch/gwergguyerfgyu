import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Image, Video, Link, X, Loader2 } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfileId: string;
  userId: string;
  onPostCreated: () => void;
}

const CreatePostDialog = ({
  open,
  onOpenChange,
  currentProfileId,
  userId,
  onPostCreated,
}: CreatePostDialogProps) => {
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "external">("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, uploading } = useImageUpload({ bucket: "post-media", maxSizeMB: 50 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (mediaType === "image" && !isImage) {
      toast.error("Please select an image file");
      return;
    }

    if (mediaType === "video" && !isVideo) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be less than 50MB");
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setCaption("");
    setMediaType("image");
    clearFile();
    setExternalUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caption.trim() && !selectedFile && !externalUrl.trim()) {
      toast.error("Please add some content to your post");
      return;
    }

    setSubmitting(true);

    try {
      let mediaUrl: string | null = null;
      let finalMediaType: "image" | "video" | "external_video" | null = null;
      let externalVideoUrl: string | null = null;

      if (selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("post-media").getPublicUrl(fileName);
        mediaUrl = data.publicUrl;
        finalMediaType = mediaType === "video" ? "video" : "image";
      } else if (externalUrl.trim()) {
        externalVideoUrl = externalUrl.trim();
        finalMediaType = "external_video";
      }

      const { error } = await supabase.from("posts").insert({
        profile_id: currentProfileId,
        caption: caption.trim() || null,
        media_url: mediaUrl,
        media_type: finalMediaType,
        external_video_url: externalVideoUrl,
      });

      if (error) throw error;

      toast.success("Post created!");
      resetForm();
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
              maxLength={2000}
            />
          </div>

          <Tabs value={mediaType} onValueChange={(v) => {
            setMediaType(v as "image" | "video" | "external");
            clearFile();
            setExternalUrl("");
          }}>
            <TabsList className="grid grid-cols-3 bg-white/10">
              <TabsTrigger value="image" className="data-[state=active]:bg-pink-500">
                <Image className="w-4 h-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="data-[state=active]:bg-pink-500">
                <Video className="w-4 h-4 mr-2" />
                Video
              </TabsTrigger>
              <TabsTrigger value="external" className="data-[state=active]:bg-pink-500">
                <Link className="w-4 h-4 mr-2" />
                Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {filePreview ? (
                <div className="relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full max-h-60 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-dashed border-white/30 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Image className="w-8 h-8 text-white/50" />
                    <span className="text-white/50">Click to upload image</span>
                  </div>
                </Button>
              )}
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {filePreview ? (
                <div className="relative">
                  <video
                    src={filePreview}
                    className="w-full max-h-60 rounded-lg"
                    controls
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-dashed border-white/30 bg-white/5 hover:bg-white/10"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-8 h-8 text-white/50" />
                    <span className="text-white/50">Click to upload video (max 50MB)</span>
                  </div>
                </Button>
              )}
            </TabsContent>

            <TabsContent value="external" className="space-y-4">
              <div className="space-y-2">
                <Label>Video URL (YouTube, TikTok)</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/50">
                  Paste a YouTube or TikTok video URL
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            disabled={submitting || uploading}
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
