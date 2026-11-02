import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { eq } from "drizzle-orm";
import { acceptDraft } from "@/actions/catalog";
import { rejectDraft } from "@/actions/exercises";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";

export default async function AdminQueue() {
  const drafts = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      author: users.name,
      authorEmail: users.email,
    })
    .from(exercises)
    .leftJoin(users, eq(users.id, exercises.authorCoachId))
    .where(eq(exercises.status, "draft"));

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Title order={1} size="h2">
          Cola de revisión
        </Title>
        <Text c="dimmed" size="sm">
          Los borradores de los entrenadores aparecen aquí hasta que los aceptes.
        </Text>
      </Stack>

      {drafts.length === 0 ? (
        <Badge variant="light" size="lg">
          No hay borradores pendientes
        </Badge>
      ) : (
        <Stack gap="sm">
          {drafts.map((draft) => (
            <Card key={draft.id} withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600}>{draft.name}</Text>
                  <Text size="xs" c="dimmed">
                    {draft.author ?? draft.authorEmail ?? "Admin"}
                  </Text>
                </Group>
                <Text size="sm">{draft.description}</Text>
                <Group gap="xs">
                  <form action={acceptDraft.bind(null, draft.id, {})}>
                    <Button type="submit" size="compact-md">
                      Aceptar
                    </Button>
                  </form>
                  <form action={rejectDraft.bind(null, draft.id)}>
                    <Button type="submit" size="compact-md" variant="light" color="red">
                      Rechazar
                    </Button>
                  </form>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
