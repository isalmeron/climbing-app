"use client";

import { Alert, Button, Group, MultiSelect, SegmentedControl, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptDraft } from "@/actions/catalog";
import { type ExerciseInput, rejectDraft, updateExercise } from "@/actions/exercises";
import { FileUpload } from "@/components/file-upload";
import { validateDemoInput } from "@/lib/demo";

const EXERCISE_ACCEPT = "video/mp4,video/webm,image/gif,image/png,image/jpeg";
const EXERCISE_HINT = "Vídeo MP4/WebM, GIF o imagen, hasta 50 MB.";

type Feedback = { tone: "ok" | "error"; text: string };

export function ExerciseEditForm({
  exerciseId,
  status,
  initial,
  tagOptions,
}: {
  exerciseId: string;
  status: "draft" | "accepted";
  initial: {
    name: string;
    description: string;
    demoType: "upload" | "embed" | null;
    demoUrl: string | null;
    demoKey: string | null;
    tagIds: string[];
  };
  tagOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [demoType, setDemoType] = useState<"upload" | "embed">(initial.demoType ?? "embed");
  const [demoUrl, setDemoUrl] = useState(initial.demoUrl ?? "");
  const [demoKey, setDemoKey] = useState(initial.demoKey ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [busy, setBusy] = useState<"save" | "accept" | "reject" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const isDraft = status === "draft";

  function changeDemoType(next: string) {
    const type = next as "upload" | "embed";
    setDemoType(type);
    // An S3 placeholder is not a meaningful embed URL — clear it when switching.
    if (type === "embed" && demoKey) {
      setDemoUrl("");
      setDemoKey("");
    }
    setFeedback(null);
  }

  function payload(): ExerciseInput {
    return {
      name,
      description,
      demoType,
      demoUrl: demoType === "upload" || demoUrl ? demoUrl : null,
      demoKey: demoType === "upload" ? demoKey || null : null,
      tagIds,
    };
  }

  async function run(kind: "save" | "accept"): Promise<boolean> {
    setFeedback(null);
    const demoError = validateDemoInput({
      demoType,
      demoUrl: demoUrl || null,
      demoKey: demoKey || null,
    });
    if (demoError) {
      setFeedback({ tone: "error", text: demoError });
      return false;
    }
    setBusy(kind);
    try {
      await updateExercise(exerciseId, payload());
      router.refresh();
      if (kind === "save") {
        setFeedback({ tone: "ok", text: "Cambios guardados." });
        return true;
      }
      await acceptDraft(exerciseId, {});
      router.push("/admin");
      return true;
    } catch (e) {
      setFeedback({ tone: "error", text: (e as Error).message });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setFeedback(null);
    setBusy("reject");
    try {
      await rejectDraft(exerciseId);
      router.push("/admin");
    } catch (e) {
      setFeedback({ tone: "error", text: (e as Error).message });
      setBusy(null);
    }
  }

  return (
    <Stack gap="lg">
      {!isDraft ? (
        <Alert color="yellow" title="Ejercicio aceptado">
          Los cambios se aplican en vivo a todos los planes que ya usan este ejercicio.
        </Alert>
      ) : null}

      <Stack gap="sm">
        <TextInput label="Nombre" required size="md" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <Textarea
          label="Descripción"
          required
          size="md"
          autosize
          minRows={3}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
      </Stack>

      <Stack gap="xs">
        <Text fw={500} size="sm">
          Demostración
        </Text>
        <SegmentedControl
          value={demoType}
          onChange={changeDemoType}
          data={[
            { value: "upload", label: "Archivo subido" },
            { value: "embed", label: "Enlace (URL)" },
          ]}
        />
        {demoType === "upload" ? (
          <FileUpload
            key={demoType}
            scope="exercise"
            accept={EXERCISE_ACCEPT}
            buttonLabel="Subir demostración"
            hint={EXERCISE_HINT}
            preview
            initialUrl={initial.demoKey ? initial.demoUrl : null}
            onUploaded={({ url, key }) => {
              setDemoUrl(url);
              setDemoKey(key);
            }}
          />
        ) : (
          <TextInput
            label="URL del vídeo"
            placeholder="https://www.youtube.com/watch?v=…"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.currentTarget.value)}
          />
        )}
      </Stack>

      <MultiSelect
        label="Etiquetas"
        placeholder="Selecciona las etiquetas"
        data={tagOptions.map((tag) => ({ value: tag.id, label: tag.label }))}
        value={tagIds}
        onChange={setTagIds}
        searchable
        clearable
        hidePickedOptions
      />

      {feedback ? <Alert color={feedback.tone === "ok" ? "teal" : "red"}>{feedback.text}</Alert> : null}

      <Group gap="sm">
        <Button size="md" loading={busy === "save"} disabled={busy !== null} onClick={() => void run("save")}>
          Guardar
        </Button>
        {isDraft ? (
          <Button
            size="md"
            variant="light"
            loading={busy === "accept"}
            disabled={busy !== null}
            onClick={() => void run("accept")}
          >
            Guardar y aceptar
          </Button>
        ) : null}
        {isDraft ? (
          <Button
            size="md"
            variant="light"
            color="red"
            loading={busy === "reject"}
            disabled={busy !== null}
            onClick={() => void reject()}
          >
            Rechazar
          </Button>
        ) : null}
      </Group>
    </Stack>
  );
}
