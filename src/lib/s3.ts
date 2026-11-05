import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

/** Per-scope rules: what may be uploaded and how big. */
const SCOPES = {
  exercise: {
    types: ["video/mp4", "video/webm", "image/gif", "image/png", "image/jpeg"],
    max: 50 * 1024 * 1024,
    folder: "exercises",
  },
  avatar: { types: ["image/png", "image/jpeg", "image/webp"], max: 5 * 1024 * 1024, folder: "avatars" },
} as const;

export type UploadScope = keyof typeof SCOPES;

export type PresignedUpload = { uploadUrl: string; key: string; publicUrl: string };

function client(): S3Client {
  const { AWS_REGION } = env();
  return new S3Client({ region: AWS_REGION });
}

/** Browsers upload straight to S3; the file never crosses our container. */
export async function presignUpload(input: {
  scope: UploadScope;
  contentType: string;
  size: number;
  filename: string;
}): Promise<PresignedUpload> {
  const rules = SCOPES[input.scope];
  if (!(rules.types as readonly string[]).includes(input.contentType)) {
    throw new Error("Tipo de archivo no permitido");
  }
  if (input.size > rules.max) {
    throw new Error("El archivo supera el tamaño máximo");
  }

  const { S3_BUCKET, S3_PREFIX, AWS_REGION } = env();
  if (!S3_BUCKET) throw new Error("S3_BUCKET is not set");

  const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
  const key = `${S3_PREFIX}${rules.folder}/${randomUUID()}-${safe}`;

  const uploadUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.size,
    }),
    { expiresIn: 300 },
  );

  return {
    uploadUrl,
    key,
    publicUrl: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
  };
}
