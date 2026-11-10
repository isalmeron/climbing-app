import { Badge, Group, Stack, Text, Title } from "@mantine/core";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/link-button";
import { db } from "@/db";
import { exercises, exerciseTags, tags, users } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { ExerciseEditForm } from "./exercise-edit-form";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminExercisePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [exercise] = await db
    .select({
      name: exercises.name,
      description: exercises.description,
      status: exercises.status,
      demoType: exercises.demoType,
      demoUrl: exercises.demoUrl,
      demoKey: exercises.demoKey,
      author: users.name,
      authorEmail: users.email,
    })
    .from(exercises)
    .leftJoin(users, eq(users.id, exercises.authorCoachId))
    .where(eq(exercises.id, id));
  if (!exercise) notFound();

  const [tagRows, selectedTags] = await Promise.all([
    db.select().from(tags).orderBy(asc(tags.sort)),
    db.select({ tagId: exerciseTags.tagId }).from(exerciseTags).where(eq(exerciseTags.exerciseId, id)),
  ]);

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap">
          <Title order={1} size="h2">
            {exercise.name}
          </Title>
          {exercise.status === "accepted" ? (
            <Badge color="teal" variant="light" size="lg">
              Aceptado
            </Badge>
          ) : (
            <Badge color="orange" variant="light" size="lg">
              En revisión
            </Badge>
          )}
        </Group>
        <Text c="dimmed" size="sm">
          {exercise.status === "accepted"
            ? "Ejercicio del catálogo."
            : `Borrador propuesto por ${exercise.author ?? exercise.authorEmail ?? "un entrenador"}.`}
        </Text>
      </Stack>

      <ExerciseEditForm
        exerciseId={id}
        status={exercise.status}
        initial={{
          name: exercise.name,
          description: exercise.description,
          demoType: exercise.demoType,
          demoUrl: exercise.demoUrl,
          demoKey: exercise.demoKey,
          tagIds: selectedTags.map((t) => t.tagId),
        }}
        tagOptions={tagRows.map((tag) => ({ id: tag.id, label: tag.labelEs }))}
      />

      <LinkButton href="/admin" variant="subtle" size="compact-md">
        Volver a la cola
      </LinkButton>
    </Stack>
  );
}
