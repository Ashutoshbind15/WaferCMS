import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

const SCOPE_LABELS: Record<string, string> = {
  openid: "Verify your identity",
  profile: "Read basic profile info",
  offline_access: "Stay connected (refresh tokens)",
  "collections:read": "Read collections and fields",
  "collections:write": "Create and change collections/fields",
  "items:read": "Read collection items",
  "items:write": "Create and change items",
  "files:read": "Read media library metadata",
  "files:write": "Upload and update files",
  "ai:draft": "Generate AI item drafts",
};

export default function ConsentPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);

  const clientId = searchParams.get("client_id") ?? "";
  const scopeParam = searchParams.get("scope") ?? "";
  const scopes = useMemo(
    () => scopeParam.split(/\s+/).filter(Boolean),
    [scopeParam],
  );

  useEffect(() => {
    if (!clientId || !user) return;
    void (async () => {
      try {
        const { data } = await authClient.$fetch<{
          client_name?: string | null;
          name?: string | null;
        }>("/oauth2/public-client", {
          method: "GET",
          query: { client_id: clientId },
        });
        setClientName(data?.client_name ?? data?.name ?? clientId);
      } catch {
        setClientName(clientId);
      }
    })();
  }, [clientId, user]);

  if (!loading && !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/consent?${searchParams.toString()}` }}
      />
    );
  }

  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid consent request</CardTitle>
            <CardDescription>
              Missing client_id. Start authorization from your MCP client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/collections">Back to admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const decide = async (accept: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: consentError } = await authClient.oauth2.consent({
        accept,
        scope: accept ? scopeParam || undefined : undefined,
      });
      if (consentError) {
        throw new Error(consentError.message ?? "Consent failed.");
      }
      const url =
        data && typeof data === "object" && "url" in data
          ? String((data as { url?: string }).url ?? "")
          : "";
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("Consent succeeded but no redirect URL was returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consent failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorize application</CardTitle>
          <CardDescription>
            {clientName ?? "An application"} wants access to WaferCMS as{" "}
            <span className="font-medium text-foreground">
              {user?.username}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="grid gap-2 text-sm">
            {scopes.length === 0 ? (
              <li className="text-muted-foreground">No scopes requested.</li>
            ) : (
              scopes.map((scope) => (
                <li
                  key={scope}
                  className="rounded-md border px-3 py-2 text-foreground"
                >
                  <div className="font-medium">{scope}</div>
                  <div className="text-muted-foreground">
                    {SCOPE_LABELS[scope] ?? "Additional permission"}
                  </div>
                </li>
              ))
            )}
          </ul>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={submitting || loading}
              onClick={() => void decide(true)}
            >
              {submitting ? "Working..." : "Allow"}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              disabled={submitting || loading}
              onClick={() => void decide(false)}
            >
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
