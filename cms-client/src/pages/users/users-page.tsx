import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { useCreateUser, useDisableUser, useUsers } from "@/lib/queries";

const formatDate = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
};

export default function UsersPage() {
  const usersQuery = useUsers();
  const createUser = useCreateUser();
  const disableUser = useDisableUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [disableTarget, setDisableTarget] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const users = usersQuery.data ?? [];
  const loading = usersQuery.isPending;
  const error =
    formError ??
    (usersQuery.error instanceof Error
      ? usersQuery.error.message
      : usersQuery.error
        ? "Failed to load users"
        : null);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setFormError("Username and password are required.");
      return;
    }

    setFormError(null);
    try {
      await createUser.mutateAsync({ username: username.trim(), password });
      setUsername("");
      setPassword("");
      toast.success("User created");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create user");
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) {
      return;
    }

    setFormError(null);
    try {
      await disableUser.mutateAsync(disableTarget.id);
      toast.success("User disabled");
      setDisableTarget(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to disable user");
    }
  };

  return (
    <>
      <Header title="Users" />
      <PageContainer>
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">Create user</h2>
              <p className="text-sm text-muted-foreground">
                Give someone else access to the CMS. Admins can create and read
                everything.
              </p>
            </div>
            <form
              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => void onCreate(event)}
            >
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                aria-label="Username"
              />
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="password"
                ariaLabel="Password"
              />
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create user"}
              </Button>
            </form>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" />
              Existing users
            </h2>
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
                              disabled={
                                disableUser.isPending &&
                                disableUser.variables === user.id
                              }
                              onClick={() =>
                                setDisableTarget({
                                  id: user.id,
                                  username: user.username,
                                })
                              }
                            >
                              {disableUser.isPending &&
                              disableUser.variables === user.id
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
          </section>
        </div>
      </PageContainer>

      <AlertDialog
        open={disableTarget !== null}
        onOpenChange={(open) => {
          if (!open && !disableUser.isPending) {
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
            <AlertDialogCancel disabled={disableUser.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={disableUser.isPending}
              onClick={() => void confirmDisable()}
            >
              {disableUser.isPending ? "Disabling..." : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
