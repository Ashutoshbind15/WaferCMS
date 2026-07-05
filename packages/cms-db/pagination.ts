export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ListPageQuery = {
  page: number;
  limit: number;
  includeCount: boolean;
};

export type PagePagination = {
  mode: "page";
  page: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
  total?: number;
  totalPages?: number;
};

export type PaginatedRows<T> = {
  data: T[];
  pagination: PagePagination;
};

export async function paginateRows<T>({
  query,
  fetchPage,
  fetchTotal,
}: {
  query: ListPageQuery;
  fetchPage: (limit: number, offset: number) => Promise<T[]>;
  fetchTotal: () => Promise<number>;
}): Promise<PaginatedRows<T>> {
  const offset = (query.page - 1) * query.limit;
  const rows = await fetchPage(query.limit + 1, offset);
  const hasNextFromFetch = rows.length > query.limit;
  const data = hasNextFromFetch ? rows.slice(0, query.limit) : rows;

  let total: number | undefined;
  let totalPages: number | undefined;
  if (query.includeCount) {
    total = await fetchTotal();
    totalPages = Math.ceil(total / query.limit);
  }

  return {
    data,
    pagination: {
      mode: "page",
      page: query.page,
      limit: query.limit,
      hasPrev: query.page > 1,
      hasNext: total !== undefined ? query.page * query.limit < total : hasNextFromFetch,
      ...(total !== undefined && { total, totalPages }),
    },
  };
}
