import { Eye, EyeOff, ImageIcon, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import {
  fileAssetUrl,
  type LibraryFileRecord,
} from "@/lib/cms-api";
import { usePatchLibraryFile } from "@/lib/queries";
import { formatBytes } from "@/lib/format-bytes";
import { Button } from "@/components/ui/button";

interface FileCardProps {
  file: LibraryFileRecord;
}

export function FileCard({ file }: FileCardProps) {
  const patchFile = usePatchLibraryFile();
  const isImage = file.contentType?.startsWith("image/") ?? false;
  const src = isImage ? fileAssetUrl(file.id) : null;

  const togglePublic = async () => {
    const nextIsPublic = !file.isPublic;
    try {
      await patchFile.mutateAsync({
        id: file.id,
        isPublic: nextIsPublic,
      });
      toast.success(nextIsPublic ? "Marked public" : "Marked private");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update file");
    }
  };

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
        <span
          className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur"
          title={file.isPublic ? "Public" : "Private"}
        >
          {file.isPublic ? (
            <>
              <Unlock className="size-3" /> Public
            </>
          ) : (
            <>
              <Lock className="size-3" /> Private
            </>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p
          className="truncate text-sm font-medium"
          title={file.originalFilename}
        >
          {file.originalFilename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.byteLength)}
        </p>
        <Button
          variant="outline"
          size="xs"
          className="mt-1 w-full"
          disabled={patchFile.isPending}
          onClick={() => void togglePublic()}
        >
          {file.isPublic ? (
            <>
              <EyeOff className="size-3" /> Make private
            </>
          ) : (
            <>
              <Eye className="size-3" /> Make public
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
