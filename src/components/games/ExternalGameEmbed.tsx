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
      <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className="w-full aspect-video bg-black/50"
          allow="fullscreen; autoplay; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
        
        {/* Bottom Bar */}
        <div className="flex items-center gap-3 p-4 bg-white/5 border-t border-white/20">
          {thumbnail && (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{title}</h3>
            <p className="text-sm text-white/60 truncate">BY: {developer}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="text-white/70 hover:text-white hover:bg-white/10"
              title="Refresh game"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10"
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
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
          <h4 className="font-semibold text-white mb-2">Description</h4>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      )}
    </div>
  );
};

export default ExternalGameEmbed;
