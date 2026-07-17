import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { type LibraryFileRecord } from "@/lib/cms-api";
import { AssetPreview } from "@/components/library/asset-preview";
import { usePatchLibraryFile } from "@/lib/queries";
import { formatBytes } from "@/lib/format-bytes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileCardProps {
  file: LibraryFileRecord;
}

export function FileCard({ file }: FileCardProps) {
  const patchFile = usePatchLibraryFile();

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
      <div className="relative h-28 overflow-hidden text-muted-foreground">
        <AssetPreview
          fileId={file.id}
          contentType={file.contentType}
          className="h-full"
          mediaClassName="object-cover"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="absolute right-1.5 top-1.5 inline-flex cursor-default items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
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
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            {file.isPublic
              ? "Anyone with the URL can load this file. No API key needed."
              : "The URL won't load without an API key."}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p
          className="truncate text-sm font-medium"
          title={file.originalFilename}
        >
          {file.originalFilename}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={file.contentType ?? undefined}>
          {formatBytes(file.byteLength)}
          {file.contentType ? ` · ${file.contentType}` : ""}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56">
            {file.isPublic
              ? "Requires an API key to view."
              : "Anyone with the URL can load it."}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
