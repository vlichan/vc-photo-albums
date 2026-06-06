import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import sharp from "sharp";

type PhotoRow = {
  id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type Failure = {
  id: string;
  reason: string;
};

type Candidate = PhotoRow & {
  image_url: string;
  thumbnail_url: string;
  thumbKey: string;
  nextThumbnailUrl: string;
};

type SupabaseScriptClient = ReturnType<typeof createClient<any>>;

const DEFAULT_R2_PUBLIC_URL = "https://img.maggieshop.vip";
const PAGE_SIZE = 1000;
const THUMBNAIL_MAX_EDGE = 500;
const WEBP_QUALITY = 78;

function loadLocalEnv() {
  if (!existsSync(".env.local")) {
    return;
  }

  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getRequiredEnv(key: string, fallbackKey?: string) {
  const value = process.env[key] || (fallbackKey ? process.env[fallbackKey] : undefined);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}${fallbackKey ? ` or ${fallbackKey}` : ""}`
    );
  }

  return value;
}

function getOptionalNumberArg(name: string) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = Number(process.argv[index + 1]);

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return value;
}

function getOptionalStringArg(name: string) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];

  if (!value) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function getMode() {
  const args = new Set(process.argv.slice(2));

  if (args.has("--apply") && args.has("--dry-run")) {
    throw new Error("Use either --dry-run or --apply, not both.");
  }

  return {
    apply: args.has("--apply"),
    confirm: args.has("--confirm"),
    limit: getOptionalNumberArg("--limit"),
    offset: getOptionalNumberArg("--offset") ?? 0,
    cursor: getOptionalStringArg("--cursor")
  };
}

function getObjectKeyFromUrl(url: string) {
  const parsed = new URL(url);
  return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
}

function getThumbnailKeyFromImageUrl(imageUrl: string) {
  const imageKey = getObjectKeyFromUrl(imageUrl);
  const directory = dirname(imageKey).replace(/\\/g, "/");
  const baseName = basename(imageKey, extname(imageKey));

  return join(directory, "thumbs", `${baseName}.webp`).replace(/\\/g, "/");
}

function getPublicUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl}/${key}`;
}

async function loadAllPhotos(supabase: SupabaseScriptClient) {
  const rows: PhotoRow[] = [];
  let from = 0;
  let totalCount = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from("photos")
      .select("id, image_url, thumbnail_url, created_at", {
        count: from === 0 ? "exact" : undefined
      })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load photos: ${error.message}`);
    }

    if (from === 0) {
      totalCount = count ?? 0;
    }

    rows.push(...((data ?? []) as PhotoRow[]));

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return {
    rows,
    totalCount
  };
}

function createCandidates(rows: PhotoRow[], r2PublicUrl: string) {
  const failures: Failure[] = [];
  const candidates: Candidate[] = [];
  let alreadyRealThumbnailCount = 0;
  let emptyUrlCount = 0;

  for (const row of rows) {
    if (!row.image_url || !row.thumbnail_url) {
      emptyUrlCount += 1;
      continue;
    }

    if (row.thumbnail_url !== row.image_url) {
      alreadyRealThumbnailCount += 1;
      continue;
    }

    try {
      const thumbKey = getThumbnailKeyFromImageUrl(row.image_url);
      candidates.push({
        ...row,
        image_url: row.image_url,
        thumbnail_url: row.thumbnail_url,
        thumbKey,
        nextThumbnailUrl: getPublicUrl(r2PublicUrl, thumbKey)
      });
    } catch (error) {
      failures.push({
        id: row.id,
        reason: error instanceof Error ? error.message : "Invalid image_url."
      });
    }
  }

  return {
    candidates,
    alreadyRealThumbnailCount,
    emptyUrlCount,
    invalidUrlFailures: failures
  };
}

function applyWindow({
  candidates,
  offset,
  limit,
  cursor
}: {
  candidates: Candidate[];
  offset: number;
  limit?: number;
  cursor?: string;
}) {
  let startIndex = offset;

  if (cursor) {
    const cursorIndex = candidates.findIndex((candidate) => candidate.id === cursor);

    if (cursorIndex === -1) {
      throw new Error(`Cursor photo id not found in candidate list: ${cursor}`);
    }

    startIndex = cursorIndex + 1;
  }

  const endIndex = limit === undefined ? undefined : startIndex + limit;

  return candidates.slice(startIndex, endIndex);
}

async function downloadImage(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image download failed with HTTP ${response.status}.`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createWebpThumbnail(imageBuffer: Buffer) {
  return sharp(imageBuffer)
    .rotate()
    .resize({
      width: THUMBNAIL_MAX_EDGE,
      height: THUMBNAIL_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: WEBP_QUALITY
    })
    .toBuffer();
}

function createR2Client({
  accountId,
  accessKeyId,
  secretAccessKey
}: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
}) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

async function uploadThumbnail({
  client,
  bucket,
  key,
  body
}: {
  client: S3Client;
  bucket: string;
  key: string;
  body: Buffer;
}) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp"
    })
  );
}

async function processCandidate({
  candidate,
  supabase,
  r2Client,
  bucket
}: {
  candidate: Candidate;
  supabase: SupabaseScriptClient;
  r2Client: S3Client;
  bucket: string;
}) {
  const original = await downloadImage(candidate.image_url);
  const thumbnail = await createWebpThumbnail(original);

  await uploadThumbnail({
    client: r2Client,
    bucket,
    key: candidate.thumbKey,
    body: thumbnail
  });

  const { error } = await supabase
    .from("photos")
    .update({
      thumbnail_url: candidate.nextThumbnailUrl
    })
    .eq("id", candidate.id);

  if (error) {
    throw new Error(`Supabase update failed: ${error.message}`);
  }
}

function printPreview(candidates: Candidate[]) {
  if (candidates.length === 0) {
    console.log("Preview: none");
    return;
  }

  console.log("Preview:");

  for (const candidate of candidates.slice(0, 5)) {
    console.log(`- photo id: ${candidate.id}`);
    console.log(`  image_url:     ${candidate.image_url}`);
    console.log(`  thumbnail_url: ${candidate.thumbnail_url}`);
    console.log(`  next_thumb:    ${candidate.nextThumbnailUrl}`);
    console.log(`  r2_key:        ${candidate.thumbKey}`);
  }
}

async function main() {
  loadLocalEnv();

  const { apply, confirm, limit, offset, cursor } = getMode();
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const r2AccountId = getRequiredEnv("R2_ACCOUNT_ID");
  const r2AccessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");
  const r2Bucket = getRequiredEnv("R2_BUCKET_NAME", "R2_BUCKET");
  const r2PublicUrl = normalizeBaseUrl(
    process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_BASE_URL || DEFAULT_R2_PUBLIC_URL
  );
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { rows, totalCount } = await loadAllPhotos(supabase);
  const {
    candidates,
    alreadyRealThumbnailCount,
    emptyUrlCount,
    invalidUrlFailures
  } = createCandidates(rows, r2PublicUrl);
  const selectedCandidates = applyWindow({
    candidates,
    offset,
    limit,
    cursor
  });

  console.log("Existing photo thumbnail generation");
  console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`R2 public URL: ${r2PublicUrl}`);
  console.log(`Total photos records: ${totalCount}`);
  console.log(`Need thumbnail generation: ${candidates.length}`);
  console.log(`Already has real thumbnail_url: ${alreadyRealThumbnailCount}`);
  console.log(`Skipped empty URLs: ${emptyUrlCount}`);
  console.log(`Invalid URL records: ${invalidUrlFailures.length}`);
  console.log(`Selected offset: ${offset}`);
  console.log(`Selected cursor: ${cursor ?? "none"}`);
  console.log(`Selected limit: ${limit ?? "all"}`);
  console.log(`Selected records this run: ${selectedCandidates.length}`);
  printPreview(selectedCandidates);

  if (invalidUrlFailures.length > 0) {
    console.log("Invalid URL records:");

    for (const failure of invalidUrlFailures.slice(0, 20)) {
      console.log(`- ${failure.id}: ${failure.reason}`);
    }
  }

  if (!apply) {
    console.log("Dry-run only. No R2 objects were uploaded and no database rows were changed.");
    return;
  }

  console.log("Apply requested. This will upload WebP thumbnails and update only photos.thumbnail_url.");

  if (!confirm) {
    console.log("Safety stop: rerun with --apply --confirm to write changes.");
    return;
  }

  const r2Client = createR2Client({
    accountId: r2AccountId,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey
  });
  const failures: Failure[] = [];
  let successCount = 0;

  for (const candidate of selectedCandidates) {
    try {
      await processCandidate({
        candidate,
        supabase,
        r2Client,
        bucket: r2Bucket
      });
      successCount += 1;
      console.log(`Updated ${successCount}/${selectedCandidates.length}: ${candidate.id}`);
    } catch (error) {
      failures.push({
        id: candidate.id,
        reason: error instanceof Error ? error.message : "Unknown processing error."
      });
      console.log(`Failed: ${candidate.id}`);
    }
  }

  console.log(`Success count: ${successCount}`);
  console.log(`Failure count: ${failures.length}`);
  console.log(`Final updated count: ${successCount}`);

  if (failures.length > 0) {
    console.log("Failures:");

    for (const failure of failures) {
      console.log(`- ${failure.id}: ${failure.reason}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
