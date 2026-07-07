import { useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fileAssetUrl } from "@/lib/cms-api";

const fitOptions = ["cover", "contain", "inside", "outside"] as const;
type FitOption = (typeof fitOptions)[number];

export default function ImageTransformTestPage() {
  const [fileId, setFileId] = useState("2");
  const [w, setW] = useState("400");
  const [h, setH] = useState("112");
  const [fit, setFit] = useState<FitOption>("cover");
  const [format, setFormat] = useState<"original" | "webp">("webp");
  const [q, setQ] = useState("80");
  const [applied, setApplied] = useState(0);

  const id = Number.parseInt(fileId, 10);
  const validId = Number.isFinite(id) && id > 0;

  const transformedUrl = useMemo(() => {
    if (!validId) return null;
    const params = new URLSearchParams();
    if (w) params.set("w", w);
    if (h) params.set("h", h);
    if (fit) params.set("fit", fit);
    if (format === "webp") params.set("format", "webp");
    if (q) params.set("q", q);
    const qs = params.toString();
    return `${fileAssetUrl(id)}${qs ? `?${qs}` : ""}`;
    // applied forces a re-render of the <img> when the user clicks "Apply"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validId, w, h, fit, format, q, applied]);

  return (
    <>
      <Header title="Image transform test" />
      <PageContainer className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>
              Dev-only page for verifying{" "}
              <code>GET /files/:id?w=&amp;h=&amp;fit=&amp;format=webp&amp;q=</code>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="file-id">File ID</Label>
              <Input
                id="file-id"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w">Width</Label>
              <Input
                id="w"
                value={w}
                onChange={(e) => setW(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 400"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h">Height</Label>
              <Input
                id="h"
                value={h}
                onChange={(e) => setH(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 112"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fit</Label>
              <Select value={fit} onValueChange={(v) => setFit(v as FitOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fitOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(v) =>
                  setFormat(v as "original" | "webp")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">webp</SelectItem>
                  <SelectItem value="original">original</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q">Quality</Label>
              <Input
                id="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                inputMode="numeric"
                placeholder="1-100"
              />
            </div>
            <div className="col-span-2 flex items-end md:col-span-3">
              <Button onClick={() => setApplied((n) => n + 1)}>Apply</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Original</CardTitle>
              <CardDescription>
                {validId ? (
                  <code>{fileAssetUrl(id)}</code>
                ) : (
                  "Enter a valid file ID"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validId ? (
                <img
                  key={`orig-${id}-${applied}`}
                  src={fileAssetUrl(id)}
                  alt="original"
                  className="max-h-80 w-full rounded border border-border object-contain"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
                  No file selected
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transformed</CardTitle>
              <CardDescription>
                {transformedUrl ? (
                  <code className="break-all">{transformedUrl}</code>
                ) : (
                  "Enter a valid file ID"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transformedUrl ? (
                <img
                  key={`tx-${applied}`}
                  src={transformedUrl}
                  alt="transformed"
                  className="max-h-80 w-full rounded border border-border object-contain"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
                  No file selected
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
