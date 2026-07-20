export type CmsToolErrorCode =
  | "invalid_argument"
  | "not_found"
  | "forbidden"
  | "failed";

/**
 * Typed failure from a CMS tool op.
 * Message/code are safe to show to the model and the admin client.
 */
export class CmsToolError extends Error {
  constructor(
    message: string,
    readonly code: CmsToolErrorCode = "failed",
  ) {
    super(message);
    this.name = "CmsToolError";
  }
}

/** Client-safe failure shape returned from every tool execute. */
export type CmsToolFailure = {
  ok: false;
  error: string;
  code: CmsToolErrorCode;
};

/** Client-safe success shape; `data` is a presented DTO (see present.ts). */
export type CmsToolSuccess<T> = {
  ok: true;
  data: T;
};

export type CmsToolResult<T> = CmsToolSuccess<T> | CmsToolFailure;

export const toCmsToolFailure = (error: unknown): CmsToolFailure => {
  if (error instanceof CmsToolError) {
    return { ok: false, error: error.message, code: error.code };
  }
  const message =
    error instanceof Error ? error.message : "Unexpected tool error";
  return { ok: false, error: message, code: "failed" };
};

/**
 * Wrap a tool op so the model and admin UI always get a CmsToolResult.
 * Never throws out of execute — failures become `{ ok: false, ... }`.
 */
export const runCmsTool = async <T>(
  fn: () => Promise<T>,
): Promise<CmsToolResult<T>> => {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return toCmsToolFailure(error);
  }
};
