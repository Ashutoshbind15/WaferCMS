import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileCard } from "@/components/library/file-card";
import {
  fetchLibraryFiles,
  uploadLibraryFile,
  type LibraryFileRecord,
} from "@/lib/cms-api";
import { formatBytes } from "@/lib/format-bytes";
import { Upload } from "lucide-react";

interface UploadEntry {
  name: string;
  size: number;
  percent: number;
}

export default function LibraryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LibraryFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploading = uploads.length > 0;

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setFiles(await fetchLibraryFiles());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPickFiles = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;

    const pending = Array.from(list);
    setError(null);

    // Initialise progress entries for every file
    setUploads(
      pending.map((f) => ({ name: f.name, size: f.size, percent: 0 })),
    );

    try {
      for (let i = 0; i < pending.length; i++) {
        const file = pending[i];
        const row = await uploadLibraryFile(file, ({ percent }) => {
          setUploads((prev) =>
            prev.map((entry, j) => (j === i ? { ...entry, percent } : entry)),
          );
        });
        setFiles((prev) => [row, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploads([]);
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={onFileChange}
      />
      <Header
        title="Images"
        action={
          <Button
            disabled={uploading}
            onClick={() => {
              void onPickFiles();
            }}
          >
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        }
      />
      <PageContainer>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {uploads.length > 0 && (
          <div className="mb-4 space-y-3">
            {uploads.map((entry) => (
              <div key={entry.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{entry.name}</span>
                  <span className="ml-2 shrink-0">
                    {entry.percent}% of {formatBytes(entry.size)}
                  </span>
                </div>
                <Progress value={entry.percent} />
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No images yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload your first image to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
