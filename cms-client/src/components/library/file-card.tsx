import { ImageIcon } from "lucide-react";
import type { LibraryFileRecord } from "@/lib/cms-api";
import { formatBytes } from "@/lib/format-bytes";

interface FileCardProps {
  file: LibraryFileRecord;
}

export function FileCard({ file }: FileCardProps) {
  const isImage = file.contentType?.startsWith("image/") ?? false;
  const src = isImage ? file.publicUrl : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-ring/40">
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageIcon className="h-8 w-8" />
        )}
      </div>

      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium" title={file.originalFilename}>
          {file.originalFilename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.byteLength)}
        </p>
      </div>
    </div>
  );
}
