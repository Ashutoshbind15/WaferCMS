import { useState } from "react";
import { FileIcon } from "lucide-react";
import { fileAssetUrl } from "@/lib/cms-api";
import { cn } from "@/lib/utils";

type AssetPreviewProps = {
  fileId: number;
  /** When known, non-images skip the thumbnail attempt. */
  contentType?: string | null;
  filename?: string | null;
  className?: string;
  mediaClassName?: string;
};

const isImageContentType = (contentType: string | null | undefined) =>
  contentType?.startsWith("image/") ?? false;

/**
 * Renders a library asset preview. Images get a thumbnail; other files (or
 * failed image loads) show a generic file placeholder.
 */
export function AssetPreview({
  fileId,
  contentType,
  filename,
  className,
  mediaClassName,
}: AssetPreviewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const knownNonImage =
    contentType != null && contentType !== "" && !isImageContentType(contentType);
  const showImage = !knownNonImage && !imageFailed;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-muted/40",
        className,
      )}
    >
      {showImage ? (
        <img
          src={fileAssetUrl(fileId)}
          alt={filename ?? ""}
          className={cn("h-full w-full object-contain", mediaClassName)}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-1 px-3 text-muted-foreground">
          <FileIcon className="size-8" />
          <span
            className="max-w-full truncate text-xs"
            title={filename ?? `Asset #${fileId}`}
          >
            {filename ?? `Asset #${fileId}`}
          </span>
        </div>
      )}
    </div>
  );
}
