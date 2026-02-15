import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, FileText } from "lucide-react";

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
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {title || "Document Viewer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={title || "Document Preview"}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            loading="lazy"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {isDrive ? "Open in Drive" : "Open"}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

DriveEmbedViewer.displayName = "DriveEmbedViewer";

export default DriveEmbedViewer;
