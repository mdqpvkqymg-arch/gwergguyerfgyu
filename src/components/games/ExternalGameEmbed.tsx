import { useRef, useState } from "react";
import { Maximize2, RefreshCw, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExternalGameEmbedProps {
  src: string;
  title: string;
  developer?: string;
  description?: string;
  thumbnail?: string;
}

const ExternalGameEmbed = ({ 
  src, 
  title, 
  developer = "Unknown Developer",
  description,
  thumbnail
}: ExternalGameEmbedProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        iframeRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          // Fallback for browsers that don't support fullscreen
        });
      }
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Game Container */}
      <div className="relative bg-card rounded-lg overflow-hidden border border-border shadow-lg">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className="w-full aspect-video bg-black"
          allow="fullscreen; autoplay; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
        
        {/* Bottom Bar */}
        <div className="flex items-center gap-3 p-3 bg-card border-t border-border">
          {thumbnail && (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate">BY: {developer}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="hover:bg-muted"
              title="Refresh game"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="hover:bg-muted"
              title="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-card rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
};

export default ExternalGameEmbed;
