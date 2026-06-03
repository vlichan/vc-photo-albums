import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getR2Config } from "@/lib/r2/config";

let client: S3Client | null = null;

function getR2Client() {
  const config = getR2Config();

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  return client;
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop();
  return extension ? extension.toLowerCase() : "jpg";
}

export function createR2ObjectKey(fileName: string, albumSlug: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  return `albums/${albumSlug}/${randomUUID()}.${extension}`;
}

export function getR2PublicUrl(key: string) {
  const config = getR2Config();
  return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

export async function createR2PresignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
) {
  const config = getR2Config();

  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream"
    }),
    {
      expiresIn: expiresInSeconds
    }
  );
}

export async function uploadImageToR2(file: File, albumSlug: string) {
  const config = getR2Config();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const key = createR2ObjectKey(file.name, albumSlug);

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream"
    })
  );

  return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

export async function deleteImageFromR2(imageUrl: string) {
  const config = getR2Config();
  const publicBaseUrl = config.publicBaseUrl.replace(/\/$/, "");

  if (!imageUrl.startsWith(`${publicBaseUrl}/`)) {
    throw new Error("Image URL does not match R2 public base URL.");
  }

  const key = decodeURIComponent(imageUrl.slice(publicBaseUrl.length + 1));

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
  );
}
