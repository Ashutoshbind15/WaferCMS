import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

const bucket = process.env.RUSTFS_BUCKET ?? "cms-files";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.RUSTFS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.RUSTFS_ENDPOINT!,
  forcePathStyle: true,
});

export async function ensureBucket(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function putObject(params: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<void> {
  await ensureBucket();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType ?? "application/octet-stream",
    }),
  );
}

export type GetObjectResult = {
  body: Readable;
  contentType: string | undefined;
  contentLength: number | undefined;
  etag: string | undefined;
  lastModified: Date | undefined;
  /** 206 when a Range was requested and honored, 200 otherwise. */
  statusCode: 200 | 206;
  contentRange: string | undefined;
};

/**
 * Fetch an object as a stream. Pass an optional `range` (raw `Range` header
 * value) to forward to S3 for seek/large-file support. Callers pipe `body`
 * straight to the Express response — never buffer the whole file.
 */
export async function getObject(params: {
  key: string;
  range?: string;
}): Promise<GetObjectResult> {
  const hasRange = typeof params.range === "string" && params.range.length > 0;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ...(hasRange ? { Range: params.range } : {}),
  });

  const output = await s3Client.send(command);
  const body = output.Body as Readable;

  return {
    body,
    contentType: output.ContentType,
    contentLength: output.ContentLength,
    etag: output.ETag,
    lastModified: output.LastModified,
    statusCode: hasRange ? 206 : 200,
    contentRange: output.ContentRange,
  };
}

export type GetObjectBufferResult = {
  buffer: Buffer;
  contentType: string | undefined;
};

/**
 * Fetch an entire object into a Buffer. Use for cases that need the full body
 * in memory (e.g. image transforms).
 */
export async function getObjectBuffer(params: {
  key: string;
}): Promise<GetObjectBufferResult> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
  });

  const output = await s3Client.send(command);
  const body = output.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return {
    buffer: Buffer.concat(chunks),
    contentType: output.ContentType,
  };
}
