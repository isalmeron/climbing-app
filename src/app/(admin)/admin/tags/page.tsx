import { Button, Card, Group, NumberInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { asc } from "drizzle-orm";
import { createTagFromForm, updateTagFromForm } from "@/actions/tag-forms";
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
          Vocabulario fijo. La clave es neutra (inglés) y no se puede cambiar; la etiqueta es lo que ve el usuario.
        </Text>
      </Stack>

      <Card withBorder radius="md" padding="md">
        <form action={createTagFromForm}>
          <Stack gap="sm">
            <TextInput name="key" label="Clave" placeholder="upper-body" required size="md" />
            <TextInput name="labelEs" label="Etiqueta" placeholder="Tren superior" required size="md" />
            <Button type="submit" size="md">
              Añadir etiqueta
            </Button>
          </Stack>
        </form>
      </Card>

      <Stack gap="xs">
        {rows.map((tag) => (
          <Card key={tag.id} withBorder radius="md" padding="md">
            <form action={updateTagFromForm.bind(null, tag.id)}>
              <Group align="flex-end" gap="sm" wrap="nowrap">
                <Stack gap={2} style={{ minWidth: 140 }}>
                  <Text size="xs" c="dimmed">
                    Clave
                  </Text>
                  <Text size="sm" ff="mono">
                    {tag.key}
                  </Text>
                </Stack>
                <TextInput name="labelEs" label="Etiqueta" defaultValue={tag.labelEs} required style={{ flex: 1 }} />
                <NumberInput name="sort" label="Orden" defaultValue={tag.sort} min={0} w={110} />
                <Button type="submit" size="sm">
                  Guardar
                </Button>
              </Group>
            </form>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
