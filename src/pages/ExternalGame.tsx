import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ExternalGameEmbed from "@/components/games/ExternalGameEmbed";

const ExternalGame = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const src = searchParams.get("src") || "";
  const title = searchParams.get("title") || "External Game";
  const developer = searchParams.get("developer") || "Unknown";
  const description = searchParams.get("description") || "";

  if (!src) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Game URL Provided</h1>
          <Button onClick={() => navigate("/game")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/game")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>

        <ExternalGameEmbed
          src={src}
          title={title}
          developer={developer}
          description={description}
        />
      </div>
    </div>
  );
};

export default ExternalGame;
