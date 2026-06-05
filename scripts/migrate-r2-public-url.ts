import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

type PhotoRow = {
  id: string;
  image_url: string | null;
  thumbnail_url: string | null;
};

type FieldName = "image_url" | "thumbnail_url";

type ReplacementExample = {
  id: string;
  field: FieldName;
  before: string;
  after: string;
};

type PlannedUpdate = {
  id: string;
  image_url?: string;
  thumbnail_url?: string;
};

type Failure = {
  id: string;
  message: string;
};

type SupabaseScriptClient = ReturnType<typeof createClient<any>>;

const DEFAULT_NEW_R2_PUBLIC_URL = "https://img.maggieshop.vip";
const PAGE_SIZE = 1000;

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

function getRequiredEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
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
    confirm: args.has("--confirm")
  };
}

function replaceUrlDomain({
  url,
  oldBaseUrl,
  newBaseUrl
}: {
  url: string | null;
  oldBaseUrl: string;
  newBaseUrl: string;
}) {
  if (!url) {
    return {
      status: "empty" as const,
      value: url
    };
  }

  if (url.startsWith(`${newBaseUrl}/`) || url === newBaseUrl) {
    return {
      status: "already-new" as const,
      value: url
    };
  }

  if (!url.startsWith(`${oldBaseUrl}/`)) {
    return {
      status: "other-domain" as const,
      value: url
    };
  }

  return {
    status: "replace" as const,
    value: `${newBaseUrl}${url.slice(oldBaseUrl.length)}`
  };
}

async function loadAllPhotos(
  supabase: SupabaseScriptClient
): Promise<{
  rows: PhotoRow[];
  totalCount: number;
}> {
  const rows: PhotoRow[] = [];
  let from = 0;
  let totalCount = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await supabase
      .from("photos")
      .select("id, image_url, thumbnail_url", {
        count: from === 0 ? "exact" : undefined
      })
      .order("created_at", { ascending: true })
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

function planUpdates(rows: PhotoRow[], oldBaseUrl: string, newBaseUrl: string) {
  const updates: PlannedUpdate[] = [];
  const examples: ReplacementExample[] = [];
  const skipped = {
    empty: 0,
    alreadyNew: 0,
    otherDomain: 0
  };
  const replaceCounts = {
    imageUrl: 0,
    thumbnailUrl: 0
  };

  for (const row of rows) {
    const update: PlannedUpdate = { id: row.id };

    for (const field of ["image_url", "thumbnail_url"] as const) {
      const result = replaceUrlDomain({
        url: row[field],
        oldBaseUrl,
        newBaseUrl
      });

      if (result.status === "empty") {
        skipped.empty += 1;
      }

      if (result.status === "already-new") {
        skipped.alreadyNew += 1;
      }

      if (result.status === "other-domain") {
        skipped.otherDomain += 1;
      }

      if (result.status === "replace" && result.value) {
        update[field] = result.value;

        if (field === "image_url") {
          replaceCounts.imageUrl += 1;
        } else {
          replaceCounts.thumbnailUrl += 1;
        }

        if (examples.length < 5) {
          examples.push({
            id: row.id,
            field,
            before: row[field] ?? "",
            after: result.value
          });
        }
      }
    }

    if (update.image_url || update.thumbnail_url) {
      updates.push(update);
    }
  }

  return {
    updates,
    examples,
    skipped,
    replaceCounts
  };
}

async function applyUpdates(
  supabase: SupabaseScriptClient,
  updates: PlannedUpdate[]
) {
  const failures: Failure[] = [];
  let successCount = 0;

  for (const update of updates) {
    const { id, ...payload } = update;
    const { error } = await supabase.from("photos").update(payload).eq("id", id);

    if (error) {
      failures.push({
        id,
        message: error.message
      });
    } else {
      successCount += 1;
    }
  }

  return {
    successCount,
    failures
  };
}

function printExamples(examples: ReplacementExample[]) {
  if (examples.length === 0) {
    console.log("Examples: none");
    return;
  }

  console.log("Examples:");

  for (const example of examples) {
    console.log(`- photo id: ${example.id}`);
    console.log(`  field: ${example.field}`);
    console.log(`  before: ${example.before}`);
    console.log(`  after:  ${example.after}`);
  }
}

async function main() {
  loadLocalEnv();

  const { apply, confirm } = getMode();
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const oldBaseUrl = normalizeBaseUrl(getRequiredEnv("OLD_R2_PUBLIC_URL"));
  const newBaseUrl = normalizeBaseUrl(
    process.env.NEW_R2_PUBLIC_URL || DEFAULT_NEW_R2_PUBLIC_URL
  );

  if (oldBaseUrl === newBaseUrl) {
    throw new Error("OLD_R2_PUBLIC_URL and NEW_R2_PUBLIC_URL must be different.");
  }

  const supabase: SupabaseScriptClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { rows, totalCount } = await loadAllPhotos(supabase);
  const { updates, examples, skipped, replaceCounts } = planUpdates(
    rows,
    oldBaseUrl,
    newBaseUrl
  );

  console.log("R2 public URL migration");
  console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`Old URL: ${oldBaseUrl}`);
  console.log(`New URL: ${newBaseUrl}`);
  console.log(`Total photos records: ${totalCount}`);
  console.log(`image_url replacements: ${replaceCounts.imageUrl}`);
  console.log(`thumbnail_url replacements: ${replaceCounts.thumbnailUrl}`);
  console.log(`Records to update: ${updates.length}`);
  console.log(`Skipped empty URLs: ${skipped.empty}`);
  console.log(`Skipped already new URL: ${skipped.alreadyNew}`);
  console.log(`Skipped other domain URLs: ${skipped.otherDomain}`);
  printExamples(examples);

  if (!apply) {
    console.log("Dry-run only. No database rows were changed.");
    return;
  }

  console.log("Apply requested. This will update only photos.image_url and photos.thumbnail_url.");

  if (!confirm) {
    console.log("Safety stop: rerun with --apply --confirm to write changes.");
    return;
  }

  const { successCount, failures } = await applyUpdates(supabase, updates);

  console.log(`Successfully updated records: ${successCount}`);
  console.log(`Failed records: ${failures.length}`);

  if (failures.length > 0) {
    console.log("Failures:");

    for (const failure of failures) {
      console.log(`- ${failure.id}: ${failure.message}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
