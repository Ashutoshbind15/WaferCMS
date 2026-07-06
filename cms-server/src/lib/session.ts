import { jwtVerify, SignJWT } from "jose";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: number;
  username: string;
};

const encoder = new TextEncoder();

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one (e.g. openssl rand -base64 32).",
    );
  }
  return encoder.encode(secret);
};

export const signSession = async (
  payload: SessionPayload,
): Promise<string> => {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
};

export const verifySession = async (
  token: string | undefined | null,
): Promise<SessionPayload | null> => {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const userId = payload.userId;
    const username = payload.username;

    if (typeof userId !== "number" || typeof username !== "string") {
      return null;
    }

    return { userId, username };
  } catch {
    return null;
  }
};
