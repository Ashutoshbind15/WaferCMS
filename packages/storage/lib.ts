import "dotenv/config";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.RUSTFS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION!,
  endpoint: process.env.RUSTFS_ENDPOINT!,
});

export const listBuckets = async () => {
  const listBucketsCmd = new ListBucketsCommand();
  const res = await s3Client.send(listBucketsCmd);
  return res.Buckets;
};
