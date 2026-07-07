import { useState } from "react";
import { Copy, KeyRound } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from "@/lib/queries";
import { type ApiKeyScope, type CreatedApiKeyRecord } from "@/lib/cms-api";

const scopeLabels: Record<ApiKeyScope, string> = {
  read: "Read",
  write: "Write",
  read_write: "Read + write",
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
};

export default function ApiKeysPage() {
  const keysQuery = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [label, setLabel] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("read");
  const [revokeTarget, setRevokeTarget] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedApiKeyRecord | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const keys = keysQuery.data ?? [];
  const loading = keysQuery.isPending;
  const error =
    formError ??
    (keysQuery.error instanceof Error
      ? keysQuery.error.message
      : keysQuery.error
        ? "Failed to load API keys"
        : null);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim()) {
      setFormError("Label is required.");
      return;
    }

    setFormError(null);
    try {
      const result = await createKey.mutateAsync({
        label: label.trim(),
        scope,
      });
      setCreatedKey(result);
      setLabel("");
      setScope("read");
      toast.success("API key created");
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Failed to create API key",
      );
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) {
      return;
    }

    setFormError(null);
    try {
      await revokeKey.mutateAsync(revokeTarget.id);
      toast.success("API key revoked");
      setRevokeTarget(null);
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Failed to revoke API key",
      );
    }
  };

  const onCopyRawKey = async () => {
    if (!createdKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdKey.rawKey);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <Header title="API keys" />
      <PageContainer>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create API key</CardTitle>
              <CardDescription>
                Generate a key for consumer backends. Copy the raw key into the
                consumer env as CMS_API_TOKEN.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
                onSubmit={(event) => void onCreate(event)}
              >
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="portfolio-prod"
                  aria-label="Key label"
                />
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as ApiKeyScope)}
                >
                  <SelectTrigger aria-label="Key scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="read_write">Read + write</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={createKey.isPending}>
                  {createKey.isPending ? "Creating..." : "Create key"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {createdKey && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="size-4" />
                  Save this key now
                </CardTitle>
                <CardDescription>
                  This is the only time the raw key is shown. Add it to the
                  consumer `.env` as `CMS_API_TOKEN`.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="block flex-1 overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs ring-1 ring-border">
                  {createdKey.rawKey}
                </code>
                <Button type="button" variant="outline" onClick={() => void onCopyRawKey()}>
                  <Copy className="size-4" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreatedKey(null)}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Existing keys</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No API keys yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-2 py-2 font-medium">Label</th>
                        <th className="px-2 py-2 font-medium">Prefix</th>
                        <th className="px-2 py-2 font-medium">Scope</th>
                        <th className="px-2 py-2 font-medium">Status</th>
                        <th className="px-2 py-2 font-medium">Created</th>
                        <th className="px-2 py-2 font-medium">Last used</th>
                        <th className="px-2 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((key) => (
                        <tr key={key.id} className="border-b border-border/60">
                          <td className="px-2 py-3">{key.label}</td>
                          <td className="px-2 py-3 font-mono text-xs">
                            {key.keyPrefix}...
                          </td>
                          <td className="px-2 py-3">{scopeLabels[key.scope]}</td>
                          <td className="px-2 py-3">
                            {key.enabled ? "Active" : "Revoked"}
                          </td>
                          <td className="px-2 py-3">
                            {formatDate(key.createdAt)}
                          </td>
                          <td className="px-2 py-3">
                            {formatDate(key.lastUsedAt)}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {key.enabled && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  revokeKey.isPending &&
                                  revokeKey.variables === key.id
                                }
                                onClick={() =>
                                  setRevokeTarget({ id: key.id, label: key.label })
                                }
                              >
                                {revokeKey.isPending &&
                                revokeKey.variables === key.id
                                  ? "Revoking..."
                                  : "Revoke"}
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
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !revokeKey.isPending) {
            setRevokeTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke API key &ldquo;{revokeTarget?.label}&rdquo;? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeKey.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revokeKey.isPending}
              onClick={() => void confirmRevoke()}
            >
              {revokeKey.isPending ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
