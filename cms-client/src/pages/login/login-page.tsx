import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
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
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

const isOauthLogin = (search: URLSearchParams) =>
  search.has("oauth_query") || search.has("client_id");

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oauthFlow = isOauthLogin(searchParams);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/collections";

  useEffect(() => {
    if (loading || !user || !oauthFlow) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error: contError } = await authClient.oauth2.continue({});
        if (cancelled) return;
        if (contError) {
          setError(contError.message ?? "Could not continue OAuth login.");
          return;
        }
        const url =
          data && typeof data === "object" && "url" in data
            ? String((data as { url?: string }).url ?? "")
            : "";
        if (url) {
          window.location.href = url;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not continue OAuth login.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, oauthFlow]);

  if (!loading && user && !oauthFlow) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await login(username.trim(), password);
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      if (oauthFlow) {
        // Fallback: authorize redirected here with query still in the URL.
        const consent = new URL("/consent", window.location.origin);
        searchParams.forEach((value, key) => {
          consent.searchParams.set(key, value);
        });
        window.location.href = consent.toString();
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>CMS Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              autoComplete="username"
              aria-label="Username"
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Password"
              autoComplete="current-password"
              ariaLabel="Password"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
