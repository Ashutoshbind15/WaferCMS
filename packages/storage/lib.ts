import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

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
