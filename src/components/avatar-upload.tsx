"use client";

import { Avatar, Group, Stack } from "@mantine/core";
import { useState } from "react";
import { FileUpload } from "@/components/file-upload";

/**
 * Photo picker: OAuth avatar is the default (shown when `image` came from a
 * provider); an upload always overrides it. Uploads go browser → S3 directly.
 */
export function AvatarUpload({
  initialUrl,
  fallbackLabel,
  onSaved,
}: {
  initialUrl?: string | null;
  fallbackLabel: string;
  /** Called with the public S3 URL once the upload lands. */
  onSaved?: (url: string) => void;
}) {
  const [image, setImage] = useState<string | null>(initialUrl ?? null);

  const initials = fallbackLabel
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Stack gap="sm">
      <Group gap="md">
        <Avatar src={image} size={72} radius="md" alt="Foto de perfil">
          {initials}
        </Avatar>
        <FileUpload
          scope="avatar"
          accept="image/png,image/jpeg,image/webp"
          buttonLabel="Subir foto"
          onUploaded={({ url }) => {
            setImage(url);
            onSaved?.(url);
          }}
        />
      </Group>
    </Stack>
  );
}
