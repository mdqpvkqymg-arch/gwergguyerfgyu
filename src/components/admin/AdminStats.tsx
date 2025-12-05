import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Trophy, Megaphone, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalConversations: number;
  totalScores: number;
  totalUpdates: number;
  recentUsers: number;
  recentMessages: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalUsers },
        { count: totalMessages },
        { count: totalConversations },
        { count: totalScores },
        { count: totalUpdates },
        { count: recentUsers },
        { count: recentMessages },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("game_scores").select("*", { count: "exact", head: true }),
        supabase.from("updates").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", last24h),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", last24h),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalMessages: totalMessages || 0,
        totalConversations: totalConversations || 0,
        totalScores: totalScores || 0,
        totalUpdates: totalUpdates || 0,
        recentUsers: recentUsers || 0,
        recentMessages: recentMessages || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading stats...</p>;
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Messages",
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Conversations",
      value: stats.totalConversations,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Game Scores",
      value: stats.totalScores,
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Updates Posted",
      value: stats.totalUpdates,
      icon: Megaphone,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const recentCards = [
    {
      title: "New Users (24h)",
      value: stats.recentUsers,
      icon: Users,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Messages (24h)",
      value: stats.recentMessages,
      icon: Clock,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          {recentCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
