import { Button } from "@/components/ui/button";
import type { PagePagination } from "@/lib/cms-api";

type ListPaginationProps = {
  pagination: PagePagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function ListPagination({
  pagination,
  onPageChange,
  disabled = false,
}: ListPaginationProps) {
  const { page, hasPrev, hasNext, totalPages } = pagination;

  if (!hasPrev && !hasNext && page === 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {totalPages !== undefined
          ? `Page ${page} of ${totalPages}`
          : `Page ${page}`}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
