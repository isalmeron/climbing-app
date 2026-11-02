/**
 * Fixed, flat tag vocabulary (ADR 0003). Values are language-neutral English
 * keys; the Spanish-only UI renders `label`.
 * Seeds the `tags` table; the admin maintains it afterwards.
 */
export const TAG_VOCABULARY = [
  { key: "upper-body", label: "Tren superior" },
  { key: "lower-body", label: "Tren inferior" },
  { key: "core", label: "Core" },
  { key: "pull", label: "Tracción" },
  { key: "push", label: "Empuje" },
  { key: "forearm", label: "Antebrazo" },
  { key: "fingers", label: "Dedos" },
  { key: "shoulders", label: "Hombros" },
  { key: "mobility", label: "Movilidad" },
  { key: "power", label: "Potencia" },
  { key: "endurance", label: "Resistencia" },
  { key: "technique", label: "Técnica" },
] as const;

export type TagKey = (typeof TAG_VOCABULARY)[number]["key"];

export function labelForTag(tag: { key: string; labelEs?: string | null }): string {
  const known = TAG_VOCABULARY.find((t) => t.key === tag.key);
  return tag.labelEs ?? known?.label ?? tag.key;
}
