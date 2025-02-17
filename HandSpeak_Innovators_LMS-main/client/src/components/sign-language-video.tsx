import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignLanguageVideoProps {
  src: string;
  title: string;
  onProgress?: (progress: number) => void;
  thumbnailUrl?: string;
}

export default function SignLanguageVideo({ src, title, onProgress, thumbnailUrl }: SignLanguageVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [videoKey, setVideoKey] = useState(0);

  const youtubeThumb = useMemo(() => {
    const match = src.match(/embed\/([^?]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
  }, [src]);

  // Extract video duration from URL
  const duration = useMemo(() => {
    const startMatch = src.match(/start=(\d+)/);
    const endMatch = src.match(/end=(\d+)/);
    const start = startMatch ? parseInt(startMatch[1]) : 0;
    const end = endMatch ? parseInt(endMatch[1]) : 0;
    return (end - start) * 1000; // Convert to milliseconds
  }, [src]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showVideo && duration) {
      // Add a small buffer to ensure video has ended
      timer = setTimeout(() => {
        setShowVideo(false);
        if (onProgress) onProgress(100);
      }, duration + 500); // Add 500ms buffer
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showVideo, duration, onProgress]);

  const handlePlay = () => {
    setVideoKey(prev => prev + 1);
    setShowVideo(true);
    setIsLoading(true);
    if (onProgress) {
      onProgress(0);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-black relative">
        {!showVideo ? (
          <>
            <img 
              src={thumbnailUrl || youtubeThumb!} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 group cursor-pointer" onClick={handlePlay}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10">
                  <Button size="lg" variant="ghost" className="rounded-full">
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>
              <div className="absolute bottom-6 left-6 text-white text-lg font-medium">
                {title}
              </div>
            </div>
          </>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <iframe
              key={videoKey}
              src={src}
              title={title}
              className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              loading="lazy"
              onLoad={() => {
                setIsLoading(false);
                if (onProgress) onProgress(50);
              }}
            />
          </>
        )}
      </div>
    </Card>
  );
}


