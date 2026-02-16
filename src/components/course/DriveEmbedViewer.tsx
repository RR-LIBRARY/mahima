import { memo, useMemo } from "react";

interface DriveEmbedViewerProps {
  url: string;
  title?: string;
}

/**
 * Smart Google Drive / PDF Viewer
 * - Detects Google Drive links and converts to preview mode
 * - Shows PDF files in iframe
 * - Provides "Open in Drive" and "Download" buttons
 */
const DriveEmbedViewer = memo(({ url, title }: DriveEmbedViewerProps) => {
  const { embedUrl, downloadUrl, isDrive, isPdf } = useMemo(() => {
    const isDriveLink = /drive\.google\.com/.test(url);
    const isPdfLink = /\.pdf($|\?)/i.test(url);

    if (isDriveLink) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch?.[1] || idParamMatch?.[1];

      if (fileId) {
        return {
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
          isDrive: true,
          isPdf: false,
        };
      }
    }

    if (isPdfLink) {
      return {
        embedUrl: url,
        downloadUrl: url,
        isDrive: false,
        isPdf: true,
      };
    }

    return { embedUrl: url, downloadUrl: url, isDrive: false, isPdf: false };
  }, [url]);

  if (!isDrive && !isPdf) return null;

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Full-page PDF/Drive viewer - no footer, fullscreen reader */}
      <iframe
        src={embedUrl}
        className="w-full border-0 flex-1"
        title={title || "Document Preview"}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="eager"
        style={{ height: 'calc(100vh - 56px)', minHeight: '80vh' }}
      />
    </div>
  );
});

DriveEmbedViewer.displayName = "DriveEmbedViewer";

export default DriveEmbedViewer;
