import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { db } from "@/db";
import { exercises, exerciseTags, tags, users } from "@/db/schema";
import { parseCatalogFilters, truncateDescription } from "@/lib/catalog-filters";
import { displayName } from "@/lib/name";
import { requireRole } from "@/lib/session";
import { labelForTag } from "@/lib/tag-vocabulary";
import { CatalogFilterControls } from "./catalog-filter-controls";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");
  const filters = parseCatalogFilters(await searchParams);
  const hasFilters = filters.status !== null || filters.tagKeys.length > 0;

  const conditions = [];
  if (filters.status) conditions.push(eq(exercises.status, filters.status));
  if (filters.tagKeys.length > 0) {
    conditions.push(
      inArray(
        exercises.id,
        db
          .select({ id: exerciseTags.exerciseId })
          .from(exerciseTags)
          .innerJoin(tags, eq(tags.id, exerciseTags.tagId))
          .where(inArray(tags.key, filters.tagKeys)),
      ),
    );
  }

  // Drafts first (newest proposals on top), then the accepted catalog by name.
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      status: exercises.status,
      demoType: exercises.demoType,
      acceptedAt: exercises.acceptedAt,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(exercises)
    .leftJoin(users, eq(users.id, exercises.authorCoachId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      sql`case when ${exercises.status} = 'draft' then 0 else 1 end`,
      desc(exercises.createdAt),
      asc(exercises.name),
    );

  const tagRows =
    rows.length > 0
      ? await db
          .select({ exerciseId: exerciseTags.exerciseId, key: tags.key, labelEs: tags.labelEs })
          .from(exerciseTags)
          .innerJoin(tags, eq(tags.id, exerciseTags.tagId))
          .where(
            inArray(
              exerciseTags.exerciseId,
              rows.map((row) => row.id),
            ),
          )
          .orderBy(asc(tags.sort))
      : [];
  const tagsByExercise = new Map<string, { key: string; labelEs: string }[]>();
  for (const row of tagRows) {
    const list = tagsByExercise.get(row.exerciseId) ?? [];
    list.push({ key: row.key, labelEs: row.labelEs });
    tagsByExercise.set(row.exerciseId, list);
  }

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Title order={1} size="h2">
          Catálogo de ejercicios
        </Title>
        <Text c="dimmed" size="sm">
          Todos los ejercicios, incluidos los borradores en revisión.
        </Text>
      </Stack>

      <CatalogFilterControls status={filters.status} tagKeys={filters.tagKeys} />

      {rows.length === 0 ? (
        hasFilters ? (
          <Stack gap="sm" align="flex-start">
            <Text c="dimmed" size="sm">
              Ningún ejercicio coincide con los filtros.
            </Text>
            <LinkButton href="/admin/catalog" variant="subtle" size="compact-sm">
              Quitar filtros
            </LinkButton>
          </Stack>
        ) : (
          <Text c="dimmed" size="sm">
            No hay ejercicios en el catálogo.
          </Text>
        )
      ) : (
        <Stack gap="sm">
          {rows.map((exercise) => {
            const author = exercise.authorEmail
              ? displayName({
                  firstName: exercise.authorFirstName,
                  lastName: exercise.authorLastName,
                  name: exercise.authorName,
                  email: exercise.authorEmail,
                })
              : "Admin";
            const exerciseTagsList = tagsByExercise.get(exercise.id) ?? [];
            return (
              <Card key={exercise.id} withBorder radius="md" padding="md">
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Link
                        href={`/admin/exercises/${exercise.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <Text fw={600}>{exercise.name}</Text>
                      </Link>
                      {exercise.status === "accepted" ? (
                        <Badge color="teal" variant="light">
                          Aceptado
                        </Badge>
                      ) : (
                        <Badge color="orange" variant="light">
                          En revisión
                        </Badge>
                      )}
                    </Group>
                    <LinkButton href={`/admin/exercises/${exercise.id}`} variant="subtle" size="compact-sm">
                      Editar
                    </LinkButton>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {truncateDescription(exercise.description)}
                  </Text>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      Por {author}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Demo: {exercise.demoType === "upload" ? "Subido" : exercise.demoType === "embed" ? "Enlace" : "—"}
                    </Text>
                    {exercise.status === "accepted" && exercise.acceptedAt ? (
                      <Text size="xs" c="dimmed">
                        Aceptado el {dateFormatter.format(exercise.acceptedAt)}
                      </Text>
                    ) : null}
                  </Group>
                  {exerciseTagsList.length > 0 ? (
                    <Group gap={4}>
                      {exerciseTagsList.map((tag) => (
                        <Badge key={tag.key} variant="outline" size="sm" color="gray">
                          {labelForTag(tag)}
                        </Badge>
                      ))}
                    </Group>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
