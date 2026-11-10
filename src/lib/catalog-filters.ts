/**
 * Pure helpers for the admin catalog list page: parsing `?status=` and
 * `?tags=` search params and building row previews. Kept framework-free so
 * they are unit-testable.
 */

export const CATALOG_STATUSES = ["draft", "accepted"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export type CatalogFilters = {
  status: CatalogStatus | null;
  tagKeys: string[];
};

/** Accepts both `?tags=a,b` and repeated `?tags=a&tags=b`. Unknown values are dropped. */
export function parseCatalogFilters(input: Record<string, string | string[] | undefined>): CatalogFilters {
  const rawStatus = input.status;
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const status = CATALOG_STATUSES.find((s) => s === statusValue) ?? null;

  const rawTags = input.tags;
  const parts = (Array.isArray(rawTags) ? rawTags : [rawTags]).flatMap((value) =>
    typeof value === "string" ? value.split(",") : [],
  );
  const tagKeys = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];

  return { status, tagKeys };
}

export const DESCRIPTION_PREVIEW_LENGTH = 100;

export function truncateDescription(text: string, max = DESCRIPTION_PREVIEW_LENGTH): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
