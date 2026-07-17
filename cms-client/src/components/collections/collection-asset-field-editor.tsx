import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileIcon, Upload, X } from "lucide-react";
import { AssetPreview } from "@/components/library/asset-preview";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  uploadLibraryFile,
  type LibraryFileRecord,
} from "@/lib/cms-api";
import { formatBytes } from "@/lib/format-bytes";
import { useLibraryFile, useLibraryFiles } from "@/lib/queries";
import { cn } from "@/lib/utils";

type AssetFieldEditorProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
};

const parseAssetId = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
};

export function AssetFieldEditor({
  value,
  onChange,
  readOnly = false,
}: AssetFieldEditorProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadSize, setUploadSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const selectedId = parseAssetId(value);
  const filesQuery = useLibraryFiles(1);
  const selectedFileQuery = useLibraryFile(selectedId);
  const libraryFiles = filesQuery.data?.data ?? [];
  const selectedFile =
    selectedFileQuery.data ??
    (selectedId === null
      ? null
      : (libraryFiles.find((file) => file.id === selectedId) ?? null));
  const uploading = uploadPercent !== null;

  const onPickFile = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadName(file.name);
    setUploadSize(file.size);
    setUploadPercent(0);

    try {
      const uploaded: LibraryFileRecord = await uploadLibraryFile(
        file,
        ({ percent }) => setUploadPercent(percent),
      );
      onChange(uploaded.id);
      void queryClient.invalidateQueries({ queryKey: ["cms", "files"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPercent(null);
      setUploadName(null);
      setUploadSize(null);
      e.target.value = "";
    }
  };

  if (readOnly) {
    if (selectedId === null) {
      return <p className="text-sm text-muted-foreground">No asset</p>;
    }
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <AssetPreview
          fileId={selectedId}
          contentType={selectedFile?.contentType}
          filename={selectedFile?.originalFilename}
          className="h-40"
        />
        <p className="truncate px-3 py-2 text-sm text-muted-foreground">
          {selectedFile?.originalFilename ?? `Asset #${selectedId}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          void onFileChange(e);
        }}
      />

      {selectedId !== null ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="relative">
            <AssetPreview
              fileId={selectedId}
              contentType={selectedFile?.contentType}
              filename={selectedFile?.originalFilename}
              className="h-40"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2"
              onClick={() => onChange(null)}
              aria-label="Remove asset"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="truncate px-3 py-2 text-sm text-muted-foreground">
            {selectedFile?.originalFilename ?? `Asset #${selectedId}`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <FileIcon className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No asset selected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload any file type, or pick one from the library.
          </p>
        </div>
      )}

      {uploading && uploadName && uploadSize !== null ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{uploadName}</span>
            <span className="ml-2 shrink-0">
              {uploadPercent}% of {formatBytes(uploadSize)}
            </span>
          </div>
          <Progress value={uploadPercent ?? 0} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => {
            void onPickFile();
          }}
        >
          <Upload className="size-4" />
          {selectedId === null ? "Upload file" : "Replace file"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={uploading}
          onClick={() => setShowPicker((open) => !open)}
        >
          {showPicker ? "Hide library" : "Choose from library"}
        </Button>
      </div>

      {showPicker ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Library
          </p>
          {filesQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : libraryFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No files in the library yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {libraryFiles.map((file) => {
                const isSelected = file.id === selectedId;
                return (
                  <button
                    key={file.id}
                    type="button"
                    className={cn(
                      "overflow-hidden rounded-md border bg-card text-left transition-colors",
                      isSelected
                        ? "border-ring ring-1 ring-ring"
                        : "border-border hover:border-ring/40",
                    )}
                    onClick={() => {
                      onChange(file.id);
                      setShowPicker(false);
                    }}
                  >
                    <AssetPreview
                      fileId={file.id}
                      contentType={file.contentType}
                      className="h-20"
                      mediaClassName="object-cover"
                    />
                    <p
                      className="truncate px-1.5 py-1 text-[11px] text-muted-foreground"
                      title={file.originalFilename}
                    >
                      {file.originalFilename}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
