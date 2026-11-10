"use client";

import { Button, FileButton, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import type { UploadScope } from "@/lib/s3";

/** The browser PUTs straight to S3 after asking our API for a presigned URL. */
export function FileUpload({
  scope,
  accept,
  buttonLabel,
  hint,
  initialUrl,
  preview,
  onUploaded,
}: {
  scope: UploadScope;
  accept: string;
  buttonLabel: string;
  hint?: string;
  initialUrl?: string | null;
  /** If set, renders the stored media as a small <img> or <video>. */
  preview?: boolean;
  /** Called with the public S3 URL and its key once the upload lands. */
  onUploaded: (file: { url: string; key: string }) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          contentType: file.type,
          size: file.size,
          filename: file.name,
        }),
      });
      const presigned = (await presign.json()) as {
        uploadUrl?: string;
        publicUrl?: string;
        key?: string;
        error?: string;
      };
      if (!presigned.uploadUrl || !presigned.publicUrl || !presigned.key) {
        throw new Error(presigned.error ?? "No se pudo subir el archivo");
      }
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("No se pudo subir el archivo");
      setUrl(presigned.publicUrl);
      onUploaded({ url: presigned.publicUrl, key: presigned.key });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isVideo = Boolean(url && /\.(mp4|webm)(\?.*)?$/.test(url));

  return (
    <Stack gap="xs">
      <Group gap="md" wrap="nowrap">
        {preview && url ? (
          isVideo ? (
            <video src={url} controls style={{ maxWidth: 288, maxHeight: 180, borderRadius: 8 }} />
          ) : (
            <img src={url} alt="Demostración actual" style={{ maxWidth: 288, maxHeight: 180, borderRadius: 8 }} />
          )
        ) : null}
        <FileButton
          accept={accept}
          onChange={(file) => {
            if (file) void upload(file);
          }}
        >
          {(props) => (
            <Button {...props} loading={busy} variant="light" size="compact-md">
              {buttonLabel}
            </Button>
          )}
        </FileButton>
      </Group>
      {hint ? (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text size="sm" c="red">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
