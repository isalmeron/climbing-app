import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { requireRole } from "@/lib/session";

export default async function CoachExercises() {
  const coach = await requireRole("coach");

  const [mine, catalog] = await Promise.all([
    db.select().from(exercises).where(eq(exercises.authorCoachId, coach.id)),
    db
      .select()
      .from(exercises)
      .where(and(eq(exercises.status, "accepted"))),
  ]);

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Ejercicios
      </Title>

      <Stack gap="xs">
        <Text fw={600}>Mis borradores</Text>
        {mine.filter((e) => e.status === "draft").length === 0 ? (
          <Text size="sm" c="dimmed">
            No tienes borradores pendientes de revisión.
          </Text>
        ) : (
          mine
            .filter((e) => e.status === "draft")
            .map((exercise) => (
              <Card key={exercise.id} withBorder radius="md" padding="md">
                <Stack gap={2}>
                  <Group>
                    <Text fw={500}>{exercise.name}</Text>
                    <Badge color="orange" variant="light">
                      En revisión
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {exercise.description}
                  </Text>
                </Stack>
              </Card>
            ))
        )}
      </Stack>

      <Stack gap="xs">
        <Text fw={600}>Catálogo ({catalog.length})</Text>
        {catalog.slice(0, 20).map((exercise) => (
          <Card key={exercise.id} withBorder radius="md" padding="md">
            <Stack gap={2}>
              <Text fw={500}>{exercise.name}</Text>
              <Text size="sm" c="dimmed">
                {exercise.description}
              </Text>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
