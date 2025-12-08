import { useNavigate } from "react-router-dom";
import { MessageCircle, Gamepad2, Bot, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const apps = [
  {
    name: "Chat",
    icon: MessageCircle,
    path: "/chat",
    color: "hsl(var(--primary))",
    description: "Message your friends",
  },
  {
    name: "Games",
    icon: Gamepad2,
    path: "/game",
    color: "hsl(var(--game-snake))",
    description: "Play & compete",
  },
  {
    name: "AI Bot",
    icon: Bot,
    path: "/ai",
    color: "hsl(var(--accent))",
    description: "Chat with Scalk Bot",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc("has_role", {
          _role: "admin",
          _user_id: user.id,
        });
        setIsAdmin(!!data);
      }
    };
    checkAdmin();
  }, []);

  const allApps = isAdmin
    ? [
        ...apps,
        {
          name: "Admin",
          icon: Shield,
          path: "/admin",
          color: "hsl(var(--destructive))",
          description: "Manage Scalk",
        },
      ]
    : apps;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-foreground mb-2">Scalk</h1>
      <p className="text-muted-foreground mb-12">Choose an app</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
        {allApps.map((app) => (
          <button
            key={app.name}
            onClick={() => navigate(app.path)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${app.color}20` }}
            >
              <app.icon
                className="w-8 h-8"
                style={{ color: app.color }}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{app.name}</p>
              <p className="text-xs text-muted-foreground">{app.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
