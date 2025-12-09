import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Megaphone, Users, Trophy, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AdminUpdates } from "@/components/admin/AdminUpdates";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminScores } from "@/components/admin/AdminScores";
import { AdminStats } from "@/components/admin/AdminStats";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin only.");
        navigate("/");
      }
      setCheckingAuth(false);
    };

    checkAdmin();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen home-gradient relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-rose-400/30 top-[-10%] left-[-10%] pointer-events-none" style={{ animationDelay: "0s" }} />
      <div className="orb w-80 h-80 bg-red-400/30 top-[50%] right-[-5%] pointer-events-none" style={{ animationDelay: "5s" }} />
      <div className="orb w-64 h-64 bg-orange-400/30 bottom-[-10%] left-[30%] pointer-events-none" style={{ animationDelay: "10s" }} />

      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-red-600 rounded-xl blur-md opacity-50" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 via-red-500 to-orange-500 flex items-center justify-center shadow-lg border border-white/30">
                  <Shield className="h-5 w-5 text-white drop-shadow-md" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Admin Panel</h1>
                <p className="text-xs text-white/60 font-medium">Manage your application</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 relative z-10">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid backdrop-blur-xl bg-white/10 border border-white/20">
            <TabsTrigger value="stats" className="gap-2 text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2 text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="scores" className="gap-2 text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Scores</span>
            </TabsTrigger>
          </TabsList>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <TabsContent value="stats" className="mt-0">
              <AdminStats />
            </TabsContent>

            <TabsContent value="updates" className="mt-0">
              <AdminUpdates />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="scores" className="mt-0">
              <AdminScores />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
