import { Badge, Button, Card, Divider, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { acceptDraft } from "@/actions/catalog";
import { inviteCoach, resendCoachInvite, revokeCoachInvite } from "@/actions/coaches";
import { rejectDraft } from "@/actions/exercises";
import { LinkButton } from "@/components/link-button";
import { db } from "@/db";
import { exercises, users } from "@/db/schema";
import { displayName } from "@/lib/name";

export default async function AdminQueue() {
  const [drafts, coaches] = await Promise.all([
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        description: exercises.description,
        author: users.name,
        authorEmail: users.email,
      })
      .from(exercises)
      .leftJoin(users, eq(users.id, exercises.authorCoachId))
      .where(eq(exercises.status, "draft")),
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.role, "coach"))
      .orderBy(asc(users.createdAt)),
  ]);

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
                <Link href={`/admin/exercises/${draft.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>{draft.name}</Text>
                    <Text size="xs" c="dimmed">
                      {draft.author ?? draft.authorEmail ?? "Admin"}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed" lineClamp={4}>
                    {draft.description}
                  </Text>
                </Link>
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
                  <LinkButton href={`/admin/exercises/${draft.id}`} variant="subtle" size="compact-md">
                    Editar
                  </LinkButton>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Divider my="sm" />

      <Stack gap="md">
        <Stack gap={2}>
          <Title order={2} size="h3">
            Entrenadores
          </Title>
          <Text c="dimmed" size="sm">
            Invita por email: recibirán un enlace de un solo uso para crear su contraseña.
          </Text>
        </Stack>

        <Card withBorder radius="md" padding="md">
          <form action={inviteCoach}>
            <Group align="flex-end" gap="sm" wrap="nowrap">
              <TextInput
                name="email"
                label="Email del entrenador"
                type="email"
                required
                size="md"
                style={{ flex: 1 }}
              />
              <Button type="submit" size="md">
                Invitar
              </Button>
            </Group>
          </form>
        </Card>

        <Stack gap="xs">
          {coaches.length === 0 ? (
            <Text c="dimmed" size="sm">
              Todavía no hay entrenadores.
            </Text>
          ) : (
            coaches.map((coach) => {
              const pending = !coach.passwordHash;
              return (
                <Card key={coach.id} withBorder radius="md" padding="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0}>
                      <Text fw={500}>{displayName(coach)}</Text>
                      <Text size="sm" c="dimmed">
                        {coach.email}
                      </Text>
                    </Stack>
                    <Group gap="xs" wrap="nowrap">
                      {pending ? (
                        <Badge variant="light" color="orange">
                          Invitación pendiente
                        </Badge>
                      ) : (
                        <Badge variant="light" color="teal">
                          Activo
                        </Badge>
                      )}
                      {pending ? (
                        <>
                          <form action={resendCoachInvite.bind(null, coach.id)}>
                            <Button type="submit" variant="subtle" size="compact-sm">
                              Reenviar
                            </Button>
                          </form>
                          <form action={revokeCoachInvite.bind(null, coach.id)}>
                            <Button type="submit" variant="subtle" size="compact-sm" color="red">
                              Revocar
                            </Button>
                          </form>
                        </>
                      ) : null}
                    </Group>
                  </Group>
                </Card>
              );
            })
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
