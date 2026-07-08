import sharp from "sharp";
import { putObject } from "@packages/storage/lib";
import { seedDemoInsertFileMetadata } from "@packages/cms-db/seed-demo";

export const seedDemoCreateGradientPng = async (
  width: number,
  height: number,
  from: string,
  to: string,
): Promise<Buffer> => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
};

export const seedDemoUploadGradientImage = async (input: {
  objectKey: string;
  filename: string;
  buffer: Buffer;
}): Promise<number> => {
  await putObject({
    key: input.objectKey,
    body: input.buffer,
    contentType: "image/png",
  });

  const { id } = await seedDemoInsertFileMetadata({
    objectKey: input.objectKey,
    originalFilename: input.filename,
    contentType: "image/png",
    byteLength: input.buffer.length,
    isPublic: true,
  });

  return id;
};
