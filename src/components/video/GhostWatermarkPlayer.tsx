import React, { useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export interface GhostWatermarkPlayerProps {
  /** YouTube video URL */
  videoUrl: string;
  /** Optional callback when video ends */
  onVideoEnd?: () => void;
  /** Optional callback for progress updates */
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
}

interface WatermarkPosition {
  top: string;
  left: string;
  opacity: number;
}

/**
 * Secure Video Player with Ghost Watermark Anti-Piracy System
 * 
 * Features:
 * - Displays user email and ID as floating watermarks
 * - Randomized watermark positions that change periodically
 * - Right-click disabled to prevent easy screenshot access
 * - pointer-events: none on overlay to not block video controls
 */
const GhostWatermarkPlayer: React.FC<GhostWatermarkPlayerProps> = ({
  videoUrl,
  onVideoEnd,
  onProgress,
}) => {
  const { user, profile } = useAuth();
  const [watermarkPositions, setWatermarkPositions] = useState<WatermarkPosition[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = useCallback((input: string): string | null => {
    if (!input) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, []);

  // Generate random watermark positions for anti-piracy
  const generateWatermarkPositions = useCallback(() => {
    const positions: WatermarkPosition[] = [];
    const count = Math.floor(Math.random() * 3) + 5;
    
    for (let i = 0; i < count; i++) {
      positions.push({
        top: `${Math.floor(Math.random() * 60) + 15}%`,
        left: `${Math.floor(Math.random() * 50) + 20}%`,
        opacity: Math.random() * 0.08 + 0.04,
      });
    }
    
    setWatermarkPositions(positions);
  }, []);

  // Initialize and periodically regenerate watermark positions
  useEffect(() => {
    generateWatermarkPositions();
    
    const interval = setInterval(() => {
      generateWatermarkPositions();
    }, 25000 + Math.random() * 10000);
    
    return () => clearInterval(interval);
  }, [generateWatermarkPositions]);

  // Mask email for privacy while keeping it identifiable
  const getMaskedEmail = (): string => {
    const email = user?.email || profile?.email;
    if (!email) return 'Student';
    
    const [name, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedName = name.length > 3 
      ? `${name.slice(0, 2)}***${name.slice(-1)}`
      : `${name[0]}***`;
    
    return `${maskedName}@${domain}`;
  };

  // Get short user ID for watermark
  const getShortId = (): string => {
    const userId = user?.id || '';
    return userId ? userId.slice(-8).toUpperCase() : '';
  };

  const videoId = extractYouTubeId(videoUrl);
  const maskedEmail = getMaskedEmail();
  const shortId = getShortId();

  // Prevent right-click on the player container
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  if (!videoId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-2xl bg-black select-none"
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none' }}
    >
      {/* Loading Skeleton */}
      {!isReady && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* Video Player Container */}
      <div className="aspect-video relative">
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls
          onReady={() => setIsReady(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onVideoEnd}
          onProgress={onProgress}
          config={{
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              playsinline: 1,
            },
          }}
        />

        {/* Ghost Watermark Overlay - pointer-events: none ensures video controls are clickable */}
        <div 
          className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
          style={{ userSelect: 'none' }}
          aria-hidden="true"
        >
          {/* Floating random watermarks */}
          {watermarkPositions.map((pos, index) => (
            <div
              key={index}
              className="absolute text-white text-xs font-medium whitespace-nowrap transform -rotate-12 select-none"
              style={{
                top: pos.top,
                left: pos.left,
                opacity: pos.opacity,
                textShadow: '0 0 3px rgba(0,0,0,0.5)',
                fontFamily: 'monospace',
              }}
            >
              {maskedEmail} | ID:{shortId}
            </div>
          ))}
          
          {/* Static corner watermark */}
          <div className="absolute top-3 right-3 text-white/15 text-sm font-semibold select-none">
            Mahima Academy
          </div>
          
          {/* Bottom watermark - always visible */}
          <div 
            className="absolute bottom-14 left-3 text-white/10 text-xs font-medium select-none"
            style={{ fontFamily: 'monospace' }}
          >
            Licensed to: {maskedEmail}
          </div>

          {/* Tiled watermark pattern for better coverage */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={`tile-${i}`}
                className="flex items-center justify-center text-white/5 text-xs font-medium whitespace-nowrap transform -rotate-45 select-none"
                style={{ fontFamily: 'monospace' }}
              >
                {shortId}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saffron accent bar (brand identity) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 opacity-80 z-10"
        style={{ background: 'linear-gradient(to right, hsl(var(--primary)), #ff6b00)' }}
      />
    </div>
  );
};

export default GhostWatermarkPlayer;
