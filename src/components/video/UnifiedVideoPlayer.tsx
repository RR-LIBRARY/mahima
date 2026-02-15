import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MahimaGhostPlayer } from "@/components/video";
import refreshLogo from "@/assets/refresh-logo.png";

const DriveEmbedViewer = lazy(() => import("@/components/course/DriveEmbedViewer"));

interface UnifiedVideoPlayerProps {
  url: string;
  title?: string;
  onEnded?: () => void;
  onReady?: () => void;
}

type Platform = "youtube" | "drive" | "vimeo" | "archive" | "direct" | "unknown";

const detectPlatform = (url: string): Platform => {
  if (!url) return "unknown";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/drive\.google\.com/.test(url)) return "drive";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/archive\.org/.test(url)) return "archive";
  if (/\.(mp4|webm|ogg)($|\?)/i.test(url)) return "direct";
  if (/\.pdf($|\?)/i.test(url)) return "drive";
  return "unknown";
};

const getVimeoId = (url: string) => url.match(/vimeo\.com\/(\d+)/)?.[1] || "";

const UnifiedVideoPlayer = ({ url, title, onEnded, onReady }: UnifiedVideoPlayerProps) => {
  const platform = detectPlatform(url);
  const containerRef = useRef<HTMLDivElement>(null);

  // YouTube — delegate to MahimaGhostPlayer
  if (platform === "youtube") {
    return (
      <MahimaGhostPlayer videoUrl={url} onEnded={onEnded} onReady={onReady} />
    );
  }

  // Drive / PDF
  if (platform === "drive") {
    return (
      <Suspense fallback={<Skeleton className="aspect-[4/3] w-full" />}>
        <div className="relative">
          <DriveEmbedViewer url={url} title={title || "Document"} />
          {/* Top overlay to hide Drive header */}
          <div className="absolute top-0 left-0 right-0 z-10" style={{ height: "48px", background: "hsl(var(--card))" }} />
          {/* Top-right pop-out button cover */}
          <div className="absolute top-0 right-0 z-10" style={{ width: "80px", height: "48px", background: "hsl(var(--card))" }} />
        </div>
      </Suspense>
    );
  }

  // Vimeo — aggressive masking
  if (platform === "vimeo") {
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden" ref={containerRef}>
        <iframe
          src={`https://player.vimeo.com/video/${getVimeoId(url)}?title=0&byline=0&portrait=0&badge=0&dnt=1`}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || "Vimeo Video"}
        />
        {/* Bottom-right Vimeo logo mask */}
        <div className="absolute bottom-0 right-0 z-[45]" style={{ width: "120px", height: "44px", background: "black" }} />
        {/* Top-right heart/like/share buttons mask */}
        <div className="absolute top-0 right-0 z-[45]" style={{ width: "60px", height: "200px", background: "black" }} />
        {/* Full-width branding bar */}
        <BrandingOverlay />
      </div>
    );
  }

  // Archive.org — aggressive masking
  if (platform === "archive") {
    const embedUrl = url.replace("/details/", "/embed/");
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden" ref={containerRef}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          title={title || "Archive.org Video"}
        />
        {/* Top title bar mask */}
        <div className="absolute top-0 left-0 right-0 z-[45]" style={{ height: "50px", background: "black" }} />
        {/* Bottom controls branding mask */}
        <div className="absolute bottom-0 right-0 z-[45]" style={{ width: "180px", height: "40px", background: "black" }} />
        {/* Full-width branding bar */}
        <BrandingOverlay />
      </div>
    );
  }

  // Direct video (mp4/webm)
  if (platform === "direct") {
    return (
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden">
        <video
          src={url}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          onContextMenu={(e) => e.preventDefault()}
          onEnded={onEnded}
          onCanPlay={() => onReady?.()}
        >
          Your browser does not support video.
        </video>
        <BrandingOverlay />
      </div>
    );
  }

  // Fallback
  return (
    <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
      <p className="text-white/50">Unsupported video format</p>
    </div>
  );
};

// Branding overlay — clean, no heavy black masking
const BrandingOverlay = () => (
  <div
    className="absolute bottom-0 left-0 right-0 z-[46] flex items-center justify-between px-3 py-2 select-none pointer-events-none"
    style={{ background: "transparent" }}
  >
    <div className="flex items-center gap-2" style={{ pointerEvents: 'auto', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
      <img src={refreshLogo} alt="" className="h-8 w-8 rounded" draggable={false} />
    </div>
    <div 
      className="flex items-center gap-1.5 px-3 py-1 rounded-md"
      style={{ background: 'rgba(128,128,128,0.65)', backdropFilter: 'blur(4px)', pointerEvents: 'auto', cursor: 'default' }}
      onClick={(e) => e.stopPropagation()}
    >
      <img src={refreshLogo} alt="" className="h-5 w-5 rounded-sm" draggable={false} />
      <span className="text-white text-xs font-semibold tracking-wide">Mahima Academy</span>
    </div>
  </div>
);

export default UnifiedVideoPlayer;
