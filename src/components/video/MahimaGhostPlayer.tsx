import { useState, useCallback, useRef, useEffect, memo } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import EndScreenOverlay from "./EndScreenOverlay";
import refreshLogo from "@/assets/refresh-logo.png";

interface MahimaGhostPlayerProps {
  videoUrl?: string;
  videoId?: string;
  onEnded?: () => void;
  onReady?: () => void;
  onDurationReady?: (duration: number) => void;
  nextVideoUrl?: string;
  nextVideoTitle?: string;
  onNextVideo?: () => void;
}

/**
 * MahimaGhostPlayer - 100% YouTube Branding Bypass Player
 * 
 * Features:
 * - Complete ghost overlay blocking ALL YouTube UI
 * - Custom controls: Play/Pause, Volume, Forward/Backward (10s), Fullscreen
 * - Blue progress bar with seeking (#1E90FF)
 * - Keyboard shortcuts: Space, Arrow keys, M, F
 * - Zero delay loading with preconnect
 * - Anti-piracy: context menu blocked, no link sharing
 * - Mahima Academy branding watermark
 */
const MahimaGhostPlayer = memo(({
  videoUrl,
  videoId,
  onEnded,
  onReady,
  onDurationReady,
  nextVideoUrl,
  nextVideoTitle,
  onNextVideo,
}: MahimaGhostPlayerProps) => {
  // Player state - starts paused, video autoplays muted then we pause immediately
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('mahima_player_volume');
    return saved ? parseFloat(saved) : 80;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeId = videoId || (videoUrl ? extractYouTubeId(videoUrl) : null);

  // YouTube IFrame API Commands via postMessage
  const sendCommand = useCallback((func: string, args: any = "") => {
    if (playerRef.current?.contentWindow) {
      try {
        const message = JSON.stringify({
          event: "command",
          func,
          args: args === "" ? "" : Array.isArray(args) ? args : [args],
        });
        playerRef.current.contentWindow.postMessage(message, "*");
      } catch (e) {
        console.warn("sendCommand failed:", func, e);
      }
    }
  }, []);

  const playVideo = useCallback(() => {
    if (!playerReady) return;
    sendCommand("playVideo");
    // Unmute on first play
    if (isMuted) {
      sendCommand("unMute");
      sendCommand("setVolume", volume);
      setIsMuted(false);
    }
    setIsPlaying(true);
  }, [sendCommand, playerReady, isMuted, volume]);

  const pauseVideo = useCallback(() => {
    if (!playerReady) return;
    sendCommand("pauseVideo");
    setIsPlaying(false);
  }, [sendCommand, playerReady]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [isPlaying, playVideo, pauseVideo]);

  const seekTo = useCallback((seconds: number, allowSeekAhead: boolean = true) => {
    if (!playerReady) return;
    const clampedTime = Math.max(0, Math.min(seconds, duration || 9999));
    sendCommand("seekTo", [clampedTime, allowSeekAhead]);
    setCurrentTime(clampedTime);
  }, [sendCommand, duration, playerReady]);

  // Forward/Backward by 10 seconds
  const skipForward = useCallback(() => {
    if (!playerReady) return;
    const newTime = Math.min(currentTime + 10, duration || 9999);
    sendCommand("seekTo", [newTime, true]);
    setCurrentTime(newTime);
  }, [currentTime, duration, sendCommand, playerReady]);

  const skipBackward = useCallback(() => {
    if (!playerReady) return;
    const newTime = Math.max(0, currentTime - 10);
    sendCommand("seekTo", [newTime, true]);
    setCurrentTime(newTime);
  }, [currentTime, sendCommand, playerReady]);

  const setPlayerVolume = useCallback((vol: number) => {
    sendCommand("setVolume", vol);
    setVolume(vol);
    localStorage.setItem('mahima_player_volume', vol.toString());
    if (vol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [sendCommand, isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      sendCommand("unMute");
      sendCommand("setVolume", volume || 80);
      setIsMuted(false);
    } else {
      sendCommand("mute");
      setIsMuted(true);
    }
  }, [isMuted, volume, sendCommand]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          (el as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Block ALL context menus and link sharing
  const preventAll = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }, []);

  // Set playback speed
  const setSpeed = useCallback((speed: number) => {
    sendCommand("setPlaybackRate", speed);
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, [sendCommand]);

  // Show/hide controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showVolumeSlider) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showVolumeSlider]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skipBackward();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          setPlayerVolume(Math.min(100, volume + 5));
          break;
        case 'arrowdown':
          e.preventDefault();
          setPlayerVolume(Math.max(0, volume - 5));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skipForward, skipBackward, toggleMute, toggleFullscreen, setPlayerVolume, volume]);

  // Setup anti-piracy event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('contextmenu', preventAll, { capture: true });
    container.addEventListener('copy', preventAll, { capture: true });
    container.addEventListener('cut', preventAll, { capture: true });
    container.addEventListener('dragstart', preventAll, { capture: true });
    
    const blockLinks = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    container.addEventListener('click', blockLinks, { capture: true });
    
    let touchTimer: ReturnType<typeof setTimeout>;
    const handleTouchStart = (e: TouchEvent) => {
      touchTimer = setTimeout(() => {
        e.preventDefault();
      }, 500);
    };
    
    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      container.removeEventListener('contextmenu', preventAll);
      container.removeEventListener('copy', preventAll);
      container.removeEventListener('cut', preventAll);
      container.removeEventListener('dragstart', preventAll);
      container.removeEventListener('click', blockLinks);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearTimeout(touchTimer);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [preventAll]);

  // YouTube API message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'onStateChange') {
          switch (data.info) {
            case -1:
              setIsBuffering(false);
              break;
            case 0:
              setIsPlaying(false);
              setShowEndScreen(true);
              onEnded?.();
              break;
            case 1:
              setIsPlaying(true);
              setIsBuffering(false);
              break;
            case 2:
              setIsPlaying(false);
              setIsBuffering(false);
              break;
            case 3:
              setIsBuffering(true);
              break;
          }
        }
        
        if (data.event === 'infoDelivery') {
          if (data.info?.duration && data.info.duration > 0) {
            setDuration(data.info.duration);
            onDurationReady?.(data.info.duration);
          }
          
          if (data.info?.currentTime !== undefined && !isSeeking) {
            setCurrentTime(data.info.currentTime);
          }
          
          if (data.info?.videoLoadedFraction !== undefined) {
            setBufferedTime(data.info.videoLoadedFraction * (data.info?.duration || duration));
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded, onDurationReady, isSeeking, duration]);

  // Request current time and duration from YouTube API every 500ms
  useEffect(() => {
    if (!playerReady) return;

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current?.contentWindow) {
        try {
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "listening", id: 1 }), "*"
          );
        } catch {}
      }
    }, 500);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playerReady]);

  const handleReplay = useCallback(() => {
    setShowEndScreen(false);
    seekTo(0);
    setTimeout(playVideo, 100);
  }, [seekTo, playVideo]);

  const handleNextVideo = useCallback(() => {
    setShowEndScreen(false);
    onNextVideo?.();
  }, [onNextVideo]);

  // Progress bar handlers
  const calculateTimeFromPosition = useCallback((clientX: number) => {
    if (!progressBarRef.current || duration <= 0) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return percentage * duration;
  }, [duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSeeking(true);
    const newTime = calculateTimeFromPosition(e.clientX);
    setCurrentTime(newTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const time = calculateTimeFromPosition(moveEvent.clientX);
      setCurrentTime(time);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalTime = calculateTimeFromPosition(upEvent.clientX);
      seekTo(finalTime);
      setIsSeeking(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [calculateTimeFromPosition, seekTo]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(percentage * duration);
    setHoverPosition(hoverX);
  }, [duration]);

  const handleProgressLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // YouTube embed URL - MAXIMUM restrictions for branding bypass + hide big play button
  const embedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?` + new URLSearchParams({
        controls: '0',
        modestbranding: '1',
        rel: '0',
        showinfo: '0',
        iv_load_policy: '3',
        disablekb: '1',
        fs: '0',
        cc_load_policy: '0',
        playsinline: '1',
        autoplay: '1',
        mute: '1',
        enablejsapi: '1',
        origin: window.location.origin,
        widget_referrer: window.location.href,
        start: '0',
      }).toString()
    : null;

  if (!youtubeId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <>
      {/* Preconnect for faster loading */}
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      
      <div 
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden shadow-2xl bg-black mahima-ghost-player select-none group ${isFullscreen ? 'mahima-fullscreen' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !showVolumeSlider && setShowControls(false)}
        tabIndex={0}
        style={{ 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation',
          position: 'relative',
        }}
      >
        {/* Video Container - Flex layout for fullscreen */}
        <div className={`relative ${isFullscreen ? 'mahima-video-container' : 'aspect-video'}`}>
          {/* Loading/Buffering spinner */}
          {(!isLoaded || isBuffering) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 pointer-events-none">
              <Loader2 className="w-14 h-14 text-[#1E90FF] animate-spin" />
            </div>
          )}

          {/* YouTube iframe */}
          <iframe
            ref={playerRef}
            src={embedUrl!}
            title="Mahima Academy Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
            style={{ pointerEvents: 'none' }}
            loading="eager"
            onLoad={() => {
              setIsLoaded(true);
              setPlayerReady(true);
              setTimeout(() => {
                sendCommand("pauseVideo");
                sendCommand("seekTo", [0, true]);
                sendCommand("setVolume", volume);
                setIsPlaying(false);
              }, 500);
              onReady?.();
            }}
          />

          {/* Bottom branding blocker - thin gradient only at very bottom, NO middle coverage */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-[39] pointer-events-none"
            style={{
              height: '60px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            }}
          />

          {/* GHOST OVERLAY - INTERCEPTS ALL INTERACTIONS */}
          <div 
            className="absolute inset-0 z-40"
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            onTouchStart={handleMouseMove}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragStart={(e) => e.preventDefault()}
            style={{ 
              background: 'transparent',
              cursor: showControls ? 'default' : 'none'
            }}
          >
            {/* Center Play/Pause/Buffering indicator */}
            <div className="absolute inset-0 flex items-center justify-center gap-8">
              {/* Backward Skip */}
              <button
                className={`w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center
                  transition-all duration-300 transform pointer-events-auto
                  ${showControls && !isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                  hover:bg-black/70 active:scale-95`}
                onClick={(e) => { e.stopPropagation(); skipBackward(); }}
              >
                <RotateCcw className="h-6 w-6 text-white" />
              </button>

              {/* Main Play Button */}
              <button
                className={`w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center
                  transition-all duration-300 transform pointer-events-auto
                  ${showControls && !isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                  hover:bg-black/70 active:scale-95`}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                <Play className="h-10 w-10 text-white ml-1" />
              </button>

              {/* Forward Skip */}
              <button
                className={`w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center
                  transition-all duration-300 transform pointer-events-auto
                  ${showControls && !isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                  hover:bg-black/70 active:scale-95`}
                onClick={(e) => { e.stopPropagation(); skipForward(); }}
              >
                <RotateCw className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* WATERMARK - Full-width bottom bar covering YouTube branding completely */}
          <div 
            className="mahima-watermark absolute left-0 right-0 z-[45] flex items-center justify-between px-3 select-none"
            style={{
              bottom: 0,
              height: '60px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
              pointerEvents: 'none',
            }}
          >
            {/* Left: Refresh logo blocking YouTube share/logo area */}
            <div 
              className="flex items-center gap-2"
              style={{ pointerEvents: 'auto', cursor: 'default' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={refreshLogo} 
                alt="" 
                className="h-11 w-11 rounded"
                draggable={false}
              />
            </div>
            {/* Right: Mahima Academy chip covering YouTube logo */}
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-md select-none"
              style={{ 
                background: 'rgba(0,0,0,0.7)', 
                backdropFilter: 'blur(6px)',
                pointerEvents: 'auto',
                cursor: 'default',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={refreshLogo} 
                alt="" 
                className="h-7 w-7 rounded-sm"
                draggable={false}
              />
              <span className="text-white text-sm font-semibold tracking-wide">
                Mahima Academy
              </span>
            </div>
          </div>

          {/* END SCREEN OVERLAY - Highest z-index to cover everything */}
          {showEndScreen && (
            <EndScreenOverlay
              onReplay={handleReplay}
              onNextVideo={nextVideoUrl ? handleNextVideo : undefined}
              nextVideoTitle={nextVideoTitle}
            />
          )}
        </div>

        {/* CONTROLS BAR - Fixed at bottom in fullscreen */}
        <div 
          className={`mahima-controls-bar absolute left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} ${showEndScreen ? 'hidden' : ''}`}
          style={{
            bottom: 0,
            paddingBottom: isFullscreen ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
          }}
        >
          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress mb-3"
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
            {/* Buffered */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
              style={{ width: `${bufferedPercentage}%` }}
            />
            {/* Played (Blue) */}
            <div 
              className="absolute inset-y-0 left-0 bg-[#1E90FF] rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1E90FF] rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercentage}% - 8px)` }}
            />
            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div 
                className="absolute -top-8 bg-black/90 text-white text-xs px-2 py-1 rounded transform -translate-x-1/2"
                style={{ left: hoverPosition }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              {/* Skip Back */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={skipBackward}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {/* Skip Forward */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={skipForward}
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              {/* Volume */}
              <div 
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                {showVolumeSlider && (
                  <div className="absolute left-10 bottom-0 bg-black/90 rounded-lg p-2 w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      onValueChange={(val) => setPlayerVolume(val[0])}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Time Display */}
              <span className="text-white text-sm ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed Control */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-white hover:bg-white/20 text-xs"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  {playbackSpeed}x
                </Button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg py-1 min-w-[80px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-white/20 ${playbackSpeed === speed ? 'text-[#1E90FF]' : 'text-white'}`}
                        onClick={() => setSpeed(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Saffron accent line at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff9b00] via-[#ff6b00] to-[#ff9b00] z-[51]" />
      </div>
    </>
  );
});

MahimaGhostPlayer.displayName = "MahimaGhostPlayer";

export default MahimaGhostPlayer;
