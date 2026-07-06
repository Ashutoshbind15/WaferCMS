import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createUser,
  disableUser,
  fetchUsers,
  type UserRecord,
} from "@/lib/cms-api";

const formatDate = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [disablingId, setDisablingId] = useState<number | null>(null);
  const [disableTarget, setDisableTarget] = useState<{
    id: number;
    username: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createUser({ username: username.trim(), password });
      setUsername("");
      setPassword("");
      toast.success("User created");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) {
      return;
    }

    const { id } = disableTarget;
    setDisablingId(id);
    setError(null);
    try {
      await disableUser(id);
      toast.success("User disabled");
      setDisableTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable user");
    } finally {
      setDisablingId(null);
    }
  };

  return (
    <>
      <Header title="Users" />
      <PageContainer>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create user</CardTitle>
              <CardDescription>
                Add another admin who can sign in to the CMS client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={(event) => void onCreate(event)}
              >
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                  aria-label="Username"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="password"
                  aria-label="Password"
                />
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create user"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Existing users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-2 py-2 font-medium">Username</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                        <th className="px-2 py-2 font-medium">Created</th>
                        <th className="px-2 py-2 font-medium">Last login</th>
                        <th className="px-2 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/60">
                          <td className="px-2 py-3">{user.username}</td>
                          <td className="px-2 py-3">
                            {user.enabled ? "Active" : "Disabled"}
                          </td>
                          <td className="px-2 py-3">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-2 py-3">
                            {formatDate(user.lastLoginAt)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {user.enabled && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disablingId === user.id}
                                onClick={() =>
                                  setDisableTarget({
                                    id: user.id,
                                    username: user.username,
                                  })
                                }
                              >
                                {disablingId === user.id
                                  ? "Disabling..."
                                  : "Disable"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <AlertDialog
        open={disableTarget !== null}
        onOpenChange={(open) => {
          if (!open && disablingId === null) {
            setDisableTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable user?</AlertDialogTitle>
            <AlertDialogDescription>
              Disable user &ldquo;{disableTarget?.username}&rdquo;? They will no
              longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disablingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={disablingId !== null}
              onClick={() => void confirmDisable()}
            >
              {disablingId !== null ? "Disabling..." : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
