export const parseBearerToken = (
  authorization: string | undefined,
): string | null => {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
};
