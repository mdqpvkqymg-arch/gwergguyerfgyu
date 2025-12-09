import { useNavigate } from "react-router-dom";
import { MessageCircle, Gamepad2, Bot, Shield, LogOut, ImageIcon, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const apps = [
  {
    name: "Chat",
    icon: MessageCircle,
    path: "/chat",
    gradient: "from-cyan-400 to-blue-500",
    description: "Message your friends",
  },
  {
    name: "Feed",
    icon: ImageIcon,
    path: "/feed",
    gradient: "from-pink-400 to-orange-500",
    description: "Share photos & videos",
  },
  {
    name: "Games",
    icon: Gamepad2,
    path: "/game",
    gradient: "from-emerald-400 to-teal-500",
    description: "Play & compete",
  },
  {
    name: "AI Bot",
    icon: Bot,
    path: "/ai",
    gradient: "from-purple-400 to-indigo-500",
    description: "Chat with Scalk Bot",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    gradient: "from-slate-400 to-gray-500",
    description: "Customize your app",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.rpc("has_role", {
          _role: "admin",
          _user_id: user.id,
        });
        setIsAdmin(!!data);
      }
      setTimeout(() => setLoaded(true), 100);
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const allApps = isAdmin
    ? [
        ...apps,
        {
          name: "Admin",
          icon: Shield,
          path: "/admin",
          gradient: "from-rose-400 to-red-500",
          description: "Manage Scalk",
        },
      ]
    : apps;

  return (
    <div className="min-h-screen home-gradient relative overflow-hidden">
      {/* Floating orbs for atmosphere */}
      <div className="orb w-96 h-96 bg-cyan-300 top-[-10%] left-[-10%]" style={{ animationDelay: "0s" }} />
      <div className="orb w-80 h-80 bg-teal-400 top-[50%] right-[-5%]" style={{ animationDelay: "5s" }} />
      <div className="orb w-64 h-64 bg-blue-400 bottom-[-10%] left-[30%]" style={{ animationDelay: "10s" }} />
      
      {/* User controls */}
      {user && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo */}
        <div 
          className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl blur-xl opacity-60 animate-pulse" />
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center animate-float shadow-2xl border border-white/30">
              <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg" style={{ fontFamily: "'Inter', sans-serif" }}>S</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 
          className={`text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.2)" }}
        >
          SCALK
        </h1>
        <p 
          className={`text-white/70 text-lg mb-16 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Choose an app to get started
        </p>

        {/* App grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
          {allApps.map((app, index) => (
            <button
              key={app.name}
              onClick={() => navigate(app.path)}
              className={`app-card flex flex-col items-center gap-4 p-8 rounded-3xl group transition-all duration-700 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              <div className={`icon-container w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${app.gradient}`}>
                <app.icon className="w-10 h-10 text-white drop-shadow-lg group-hover:animate-icon-glow" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white text-lg">{app.name}</p>
                <p className="text-sm text-white/60 mt-1">{app.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom decoration */}
        <div 
          className={`mt-20 flex items-center gap-2 transition-all duration-700 delay-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <span className="text-white/40 text-xs tracking-widest uppercase">Connect • Play • Explore</span>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Home;
