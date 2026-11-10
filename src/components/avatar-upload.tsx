"use client";

import { Avatar, Button, FileButton, Group, Stack, Text } from "@mantine/core";
import { useRef, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<File | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "avatar",
          contentType: file.type,
          size: file.size,
          filename: file.name,
        }),
      });
      const presigned = (await presign.json()) as { uploadUrl?: string; publicUrl?: string; error?: string };
      if (!presigned.uploadUrl || !presigned.publicUrl) {
        throw new Error(presigned.error ?? "No se pudo subir la imagen");
      }
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("No se pudo subir la imagen");
      setImage(presigned.publicUrl);
      onSaved?.(presigned.publicUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      fileRef.current = null;
    }
  }

  const initials = fallbackLabel
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Stack gap="sm">
      <Group gap="md">
        <Avatar src={image} size={72} radius="md" alt="Foto de perfil">
          {initials}
        </Avatar>
        <FileButton
          accept="image/png,image/jpeg,image/webp"
          onChange={(file) => {
            if (file) void upload(file);
          }}
        >
          {(props) => (
            <Button {...props} loading={busy} variant="light" size="compact-md">
              Subir foto
            </Button>
          )}
        </FileButton>
      </Group>
      {error ? (
        <Text size="sm" c="red">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
