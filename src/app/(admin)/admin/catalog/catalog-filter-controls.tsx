"use client";

import { MultiSelect, SegmentedControl, Stack } from "@mantine/core";
import { useRouter } from "next/navigation";
import { TAG_VOCABULARY } from "@/lib/tag-vocabulary";

type CatalogFilterControlsProps = {
  status: "draft" | "accepted" | null;
  tagKeys: string[];
};

/** Pushes filter changes as `?status=&tags=` searchParams; the page re-renders server-side. */
export function CatalogFilterControls({ status, tagKeys }: CatalogFilterControlsProps) {
  const router = useRouter();

  const apply = (nextStatus: string, nextTags: string[]) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextTags.length > 0) params.set("tags", nextTags.join(","));
    const query = params.toString();
    router.push(query ? `/admin/catalog?${query}` : "/admin/catalog");
  };

  return (
    <Stack gap="sm" w="100%">
      <SegmentedControl
        aria-label="Estado"
        value={status ?? ""}
        onChange={(value) => apply(value, tagKeys)}
        data={[
          { value: "", label: "Todos" },
          { value: "draft", label: "En revisión" },
          { value: "accepted", label: "Aceptado" },
        ]}
      />
      <MultiSelect
        aria-label="Etiquetas"
        placeholder="Filtrar por etiquetas"
        data={TAG_VOCABULARY.map((tag) => ({ value: tag.key, label: tag.label }))}
        value={tagKeys}
        searchable
        clearable
        onChange={(values) => apply(status ?? "", values)}
      />
    </Stack>
  );
}
