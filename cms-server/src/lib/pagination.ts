import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  type ListPageQuery,
} from "@packages/cms-db/pagination";

export function parseListQuery(
  query: Record<string, unknown>,
): ListPageQuery {
  const pageRaw = query.page;
  const limitRaw = query.limit;
  const countRaw = query.count;

  let page = DEFAULT_PAGE;
  if (pageRaw !== undefined && pageRaw !== "") {
    const parsed = Number.parseInt(String(pageRaw), 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("Invalid page.");
    }
    page = parsed;
  }

  let limit = DEFAULT_LIMIT;
  if (limitRaw !== undefined && limitRaw !== "") {
    const parsed = Number.parseInt(String(limitRaw), 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("Invalid limit.");
    }
    limit = Math.min(parsed, MAX_LIMIT);
  }

  const includeCount =
    countRaw === "true" || countRaw === "1" || countRaw === true;

  return { page, limit, includeCount };
}
