import { Button, Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { asc } from "drizzle-orm";
import { createTagFromForm } from "@/actions/tag-forms";
import { db } from "@/db";
import { tags } from "@/db/schema";

export default async function TagsPage() {
  const rows = await db.select().from(tags).orderBy(asc(tags.sort), asc(tags.key));

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Title order={1} size="h2">
          Etiquetas
        </Title>
        <Text c="dimmed" size="sm">
          Vocabulario fijo. La clave es neutra (inglés) y la etiqueta es lo que ve el usuario.
        </Text>
      </Stack>

      <Card withBorder radius="md" padding="md">
        <form action={createTagFromForm}>
          <Stack gap="sm">
            <TextInput name="key" label="Clave" placeholder="upper-body" required size="md" />
            <TextInput
              name="labelEs"
              label="Etiqueta"
              placeholder="Tren superior"
              required
              size="md"
            />
            <Button type="submit" size="md">
              Añadir etiqueta
            </Button>
          </Stack>
        </form>
      </Card>

      <Stack gap="xs">
        {rows.map((tag) => (
          <Group key={tag.id} justify="space-between">
            <Text>{tag.labelEs}</Text>
            <Text size="xs" c="dimmed">
              {tag.key}
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
