import { useState } from "react";
import { Navigate, useLocation } from "react-router";
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

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/content";

  if (!loading && user) {
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
      await login(username.trim(), password);
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
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              aria-label="Password"
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
