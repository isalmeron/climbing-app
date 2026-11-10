"use server";

import { revalidatePath } from "next/cache";
import { createTag, updateTag } from "@/actions/catalog";

export async function createTagFromForm(formData: FormData): Promise<void> {
  await createTag({
    key: String(formData.get("key") ?? "").trim(),
    labelEs: String(formData.get("labelEs") ?? "").trim(),
    sort: Number(formData.get("sort") ?? 0),
  });
  revalidatePath("/admin/tags");
}

export async function updateTagFromForm(id: string, formData: FormData): Promise<void> {
  await updateTag(id, {
    key: String(formData.get("key") ?? "").trim(),
    labelEs: String(formData.get("labelEs") ?? "").trim(),
    sort: Number(formData.get("sort") ?? 0),
  });
  revalidatePath("/admin/tags");
}
