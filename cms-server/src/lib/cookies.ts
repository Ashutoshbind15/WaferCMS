import type { CookieOptions, Response } from "express";
import { SESSION_MAX_AGE_SECONDS } from "./session";

export const getSessionCookieName = (): string => {
  return process.env.COOKIE_SECURE === "true"
    ? "__Host-cms-session"
    : "cms-session";
};

const isCrossOriginCors = (): boolean => {
  const origin = process.env.CORS_ORIGIN?.trim();
  return Boolean(origin);
};

export const getSessionCookieOptions = (): CookieOptions => {
  const secure = process.env.COOKIE_SECURE === "true";
  const crossOrigin = isCrossOriginCors();

  return {
    httpOnly: true,
    secure,
    sameSite: crossOrigin && secure ? "none" : "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  };
};

export const setSessionCookie = (res: Response, token: string): void => {
  res.cookie(getSessionCookieName(), token, getSessionCookieOptions());
};

export const clearSessionCookie = (res: Response): void => {
  res.clearCookie(getSessionCookieName(), {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite:
      isCrossOriginCors() && process.env.COOKIE_SECURE === "true"
        ? "none"
        : "lax",
    path: "/",
  });
};
