import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { CollectionItemFieldViews } from "@/components/collections/collection-item-field-views";
import { itemDisplayTitle } from "@/components/collections/collection-item-utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useDeleteCollectionItem,
  useInfiniteCollectionItems,
} from "@/lib/queries";
import type { CollectionFieldRecord } from "@/lib/cms-api";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CollectionItemsBrowseViewProps = {
  collectionId: number;
  fields: CollectionFieldRecord[];
  onEdit: (itemId: number) => void;
  onNewItem: () => void;
};

function useScrollSpy(
  itemIds: number[],
  onActiveItemChange: (itemId: number) => void,
  scrollLockRef: RefObject<boolean>,
) {
  useEffect(() => {
    if (itemIds.length === 0) {
      return;
    }

    const elements = itemIds
      .map((id) => document.getElementById(`collection-item-${id}`))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockRef.current) {
          return;
        }

        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }

        const topMost = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top
            ? entry
            : best,
        );

        const id = Number(topMost.target.getAttribute("data-item-id"));
        if (Number.isInteger(id) && id > 0) {
          onActiveItemChange(id);
        }
      },
      {
        root: null,
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [itemIds, onActiveItemChange, scrollLockRef]);
}

function useInfiniteScrollSentinel(
  hasMore: boolean,
  loadingMore: boolean,
  onLoadMore: () => void,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return sentinelRef;
}

export function CollectionItemsBrowseView({
  collectionId,
  fields,
  onEdit,
  onNewItem,
}: CollectionItemsBrowseViewProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const scrollLockRef = useRef(false);
  const scrollLockTimerRef = useRef<number | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingSidebarScrollId, setPendingSidebarScrollId] = useState<
    number | null
  >(null);

  const itemsQuery = useInfiniteCollectionItems(collectionId);
  const deleteItem = useDeleteCollectionItem(collectionId);

  const items = useMemo(
    () => itemsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [itemsQuery.data],
  );
  const loading = itemsQuery.isPending;
  const loadingMore = itemsQuery.isFetchingNextPage;
  const hasMore = itemsQuery.hasNextPage ?? false;

  const queryError =
    !Number.isInteger(collectionId) || collectionId <= 0
      ? "Invalid collection id."
      : itemsQuery.error instanceof Error
        ? itemsQuery.error.message
        : itemsQuery.error
          ? "Failed to load items"
          : null;

  const itemIds = items.map((item) => item.id);
  const stableOnActiveItemChange = useCallback(
    (itemId: number) => setActiveItemId(itemId),
    [],
  );

  useScrollSpy(itemIds, stableOnActiveItemChange, scrollLockRef);

  const loadMore = useCallback(() => {
    void itemsQuery.fetchNextPage();
  }, [itemsQuery]);

  const sentinelRef = useInfiniteScrollSentinel(hasMore, loadingMore, loadMore);

  useEffect(() => {
    if (items.length === 0) {
      setActiveItemId(null);
      return;
    }
    setActiveItemId((current) =>
      current && items.some((item) => item.id === current)
        ? current
        : items[0].id,
    );
  }, [items]);

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: number,
  ) => {
    event.stopPropagation();
    setDeletingId(itemId);
    try {
      await deleteItem.mutateAsync(itemId);
      toast.success("Item deleted.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to delete item";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const scrollToItem = (itemId: number) => {
    setActiveItemId(itemId);
    scrollLockRef.current = true;
    if (scrollLockTimerRef.current !== null) {
      window.clearTimeout(scrollLockTimerRef.current);
    }

    document
      .getElementById(`collection-item-${itemId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    scrollLockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false;
      scrollLockTimerRef.current = null;
    }, 700);
  };

  useEffect(() => {
    if (pendingSidebarScrollId === null || !sidebarRef.current) {
      return;
    }

    const activeButton = sidebarRef.current.querySelector<HTMLElement>(
      `[data-sidebar-item-id="${pendingSidebarScrollId}"]`,
    );
    activeButton?.scrollIntoView({ block: "nearest" });
    setPendingSidebarScrollId(null);
  }, [activeItemId, pendingSidebarScrollId]);

  useEffect(() => {
    if (activeItemId !== null) {
      setPendingSidebarScrollId(activeItemId);
    }
  }, [activeItemId]);

  useEffect(
    () => () => {
      if (scrollLockTimerRef.current !== null) {
        window.clearTimeout(scrollLockTimerRef.current);
      }
    },
    [],
  );

  if (queryError) {
    return <p className="text-sm text-destructive">{queryError}</p>;
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No items yet
        </p>
        <Button size="sm" className="mt-4" onClick={onNewItem}>
          New item
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-12">
      <div className="min-w-0 px-2 py-6 md:px-6 md:py-10 lg:px-8 lg:py-12">
        {items.map((item, index) => {
          const title = itemDisplayTitle(item, fields);
          return (
            <div key={item.id}>
              {index > 0 ? <Separator className="my-16 md:my-20" /> : null}
              <section
                id={`collection-item-${item.id}`}
                data-item-id={item.id}
                className="scroll-mt-28"
              >
                <header className="mb-8 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {title}
                      </h2>
                      {item.draft ? (
                        <span className="rounded-md border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Updated {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item.id)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={(event) => void handleDelete(event, item.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {deletingId === item.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </header>

                <CollectionItemFieldViews
                  fields={fields}
                  values={item.values}
                />
              </section>
            </div>
          );
        })}

        {hasMore ? (
          <div ref={sentinelRef} className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {loadingMore ? "Loading more items…" : ""}
            </p>
          </div>
        ) : (
          <div className="pb-8" />
        )}
      </div>

      <aside
        ref={sidebarRef}
        className="no-scrollbar sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto lg:block"
      >
        <p className="mb-3 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Items
        </p>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const title = itemDisplayTitle(item, fields);
            const isActive = item.id === activeItemId;
            return (
              <button
                key={item.id}
                type="button"
                data-sidebar-item-id={item.id}
                onClick={() => scrollToItem(item.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <p className="truncate text-sm">{title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.draft ? "Draft · " : ""}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
