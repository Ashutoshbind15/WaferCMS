import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ListPagination } from "@/components/layout/list-pagination";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileCard } from "@/components/library/file-card";
import { useLibraryFiles } from "@/lib/queries";
import { uploadLibraryFile } from "@/lib/cms-api";
import { formatBytes } from "@/lib/format-bytes";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UploadEntry {
  name: string;
  size: number;
  percent: number;
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filesQuery = useLibraryFiles(page);
  const files = filesQuery.data?.data ?? [];
  const pagination = filesQuery.data?.pagination ?? null;
  const loading = filesQuery.isPending;
  const uploading = uploads.length > 0;

  const queryError =
    filesQuery.error instanceof Error
      ? filesQuery.error.message
      : filesQuery.error
        ? "Failed to load files"
        : null;

  const onPickFiles = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;

    const pending = Array.from(list);
    setError(null);

    setUploads(
      pending.map((f) => ({ name: f.name, size: f.size, percent: 0 })),
    );

    try {
      for (let i = 0; i < pending.length; i++) {
        const file = pending[i];
        await uploadLibraryFile(file, ({ percent }) => {
          setUploads((prev) =>
            prev.map((entry, j) => (j === i ? { ...entry, percent } : entry)),
          );
        });
      }
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ["cms", "files"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploads([]);
      e.target.value = "";
    }
  };

  return (
    <>
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={onFileChange}
      />
      <Header
        title="Library"
        action={
          <Button
            disabled={uploading}
            onClick={() => {
              void onPickFiles();
            }}
          >
            <Upload className="mr-1 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
        }
      />
      <PageContainer>
        {error || queryError ? (
          <p className="text-sm text-destructive">{error ?? queryError}</p>
        ) : null}

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
              No files yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload images, documents, or any other file to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        )}

        {pagination ? (
          <ListPagination
            pagination={pagination}
            disabled={loading}
            onPageChange={setPage}
          />
        ) : null}
      </PageContainer>
    </>
  );
}
