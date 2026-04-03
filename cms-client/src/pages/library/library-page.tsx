import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { FileCard } from "@/components/library/file-card";
import { mockLibraryImages } from "@/lib/mock-data";
import { Upload } from "lucide-react";

export default function LibraryPage() {
  return (
    <>
      <Header
        title="Images"
        action={
          <Button onClick={() => console.log("Upload image triggered")}>
            <Upload className="mr-1 h-4 w-4" />
            Upload image
          </Button>
        }
      />
      <PageContainer>
        {mockLibraryImages.length === 0 ? (
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
            {mockLibraryImages.map((image) => (
              <FileCard key={image.id} image={image} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
