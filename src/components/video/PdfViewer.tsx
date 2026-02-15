import { memo, useMemo } from "react";
import { FileText } from "lucide-react";
import mahimaLogo from "@/assets/mahima-academy-logo.png";

interface PdfViewerProps {
  url: string;
  title?: string;
}

/**
 * Inline PDF Viewer - renders PDFs on-domain with no external redirects.
 * Supports Google Drive PDFs and direct PDF URLs.
 * Hides browser toolbar and Drive branding.
 */
const PdfViewer = memo(({ url, title }: PdfViewerProps) => {
  const embedUrl = useMemo(() => {
    // Google Drive PDF
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const driveIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = driveMatch?.[1] || driveIdParam?.[1];

    if (fileId || /drive\.google\.com/.test(url)) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Direct PDF - append toolbar=0 to hide browser PDF toolbar
    if (/\.pdf($|\?)/i.test(url)) {
      return url.includes("#") ? url : `${url}#toolbar=0&navpanes=0`;
    }

    return url;
  }, [url]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground truncate">
          {title || "Document"}
        </span>
      </div>

      {/* PDF iframe with Drive masking overlays */}
      <div className="relative aspect-[4/3]">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title={title || "PDF Document"}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          loading="lazy"
        />

        {/* Top-bar overlay to hide Drive header (filename, pop-out) */}
        {/drive\.google\.com/.test(url) && (
          <>
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{ height: "48px", background: "hsl(var(--card))" }}
            />
            {/* Bottom-right Drive branding overlay */}
            <div
              className="absolute bottom-0 right-0 z-10"
              style={{ width: "200px", height: "40px", background: "hsl(var(--card))" }}
            />
          </>
        )}

        {/* Branding bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-2 px-4 py-1.5 select-none pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
        >
          <img src={mahimaLogo} alt="" className="h-5 w-5 rounded" draggable={false} />
          <span className="text-white text-xs font-semibold tracking-wide">
            Mahima Academy
          </span>
        </div>
      </div>
    </div>
  );
});

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
