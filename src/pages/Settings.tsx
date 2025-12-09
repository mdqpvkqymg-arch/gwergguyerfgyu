import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Moon, Sun, User, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useImageUpload";

interface Profile {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_color: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("scalk_theme") === "dark";
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload({ bucket: "avatars", maxSizeMB: 5 });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("scalk_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("scalk_theme", "light");
    }
  }, [darkMode]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setDisplayName(data.display_name);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const url = await uploadImage(file, user.id);
    if (url) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);

      if (error) {
        toast.error("Failed to update avatar");
      } else {
        setProfile({ ...profile, avatar_url: url });
        toast.success("Avatar updated!");
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        display_name: displayName.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      });
      toast.success("Profile updated!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen home-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen home-gradient relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-purple-400/30 top-[-10%] left-[-10%] pointer-events-none" />
      <div className="orb w-80 h-80 bg-indigo-400/30 top-[50%] right-[-5%] pointer-events-none" />
      <div className="orb w-64 h-64 bg-cyan-400/30 bottom-[-10%] left-[30%] pointer-events-none" />

      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 p-4 relative z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto p-6">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="w-full bg-white/10 border border-white/20 backdrop-blur-xl mb-6">
            <TabsTrigger
              value="appearance"
              className="flex-1 data-[state=active]:bg-white/20 text-white"
            >
              <Sun className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex-1 data-[state=active]:bg-white/20 text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Appearance Settings</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-white" />
                  ) : (
                    <Sun className="h-5 w-5 text-white" />
                  )}
                  <div>
                    <Label className="text-white font-medium">Dark Mode</Label>
                    <p className="text-sm text-white/60">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback
                      style={{ backgroundColor: profile?.avatar_color }}
                      className="text-white text-2xl font-bold"
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-white/60 mt-2">Click to change avatar</p>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white mb-2 block">First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-2 block">Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
