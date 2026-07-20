export class McpToolError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_argument" | "not_found" | "forbidden" | "failed" =
      "failed",
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export const textResult = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

export const errorResult = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unexpected tool error";
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
};
