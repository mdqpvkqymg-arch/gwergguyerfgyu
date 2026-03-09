import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Feed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-black/80 backdrop-blur-md border-b border-white/10 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">TikTok</h1>
      </div>

      {/* Embedded TikTok - cropped to hide site's top bar */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src="https://pixelforces.io/app2/Tik%20Tok/"
          title="TikTok"
          className="absolute border-0"
          style={{
            top: "-50px",
            left: 0,
            width: "100%",
            height: "calc(100% + 50px)",
          }}
          allow="fullscreen; autoplay; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default Feed;
