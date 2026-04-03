import { ImageIcon } from "lucide-react";
import type { LibraryImage } from "@/lib/mock-data";

interface FileCardProps {
  image: LibraryImage;
}

export function FileCard({ image }: FileCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-ring/40">
      <div className="flex h-28 items-center justify-center bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400">
        <ImageIcon className="h-8 w-8" />
      </div>

      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium" title={image.name}>
          {image.name}
        </p>
        <p className="text-xs text-muted-foreground">{image.size}</p>
      </div>
    </div>
  );
}
