export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const n = bytes / k ** i;
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${sizes[i]}`;
}
