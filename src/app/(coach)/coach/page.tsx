import { Badge, Button, Card, Divider, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { createInviteLinkForm } from "@/actions/invite";
import { db } from "@/db";
import { athleteCoach, planAssignments, trainingPlans, users } from "@/db/schema";
import { requireRole } from "@/lib/session";

export default async function CoachHome() {
  const coach = await requireRole("coach");

  const athletes = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      planName: trainingPlans.name,
    })
    .from(athleteCoach)
    .innerJoin(users, eq(users.id, athleteCoach.athleteId))
    .leftJoin(
      planAssignments,
      and(
        eq(planAssignments.athleteId, athleteCoach.athleteId),
        isNull(planAssignments.archivedAt),
      ),
    )
    .leftJoin(trainingPlans, eq(trainingPlans.id, planAssignments.planId))
    .where(eq(athleteCoach.coachId, coach.id));

  const plans = await db
    .select()
    .from(trainingPlans)
    .where(and(eq(trainingPlans.coachId, coach.id), isNull(trainingPlans.archivedAt)));

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Tus deportistas
      </Title>

      <Paper withBorder p="md" radius="md">
        <Stack gap="xs">
          <Text fw={600}>Invitar a un deportista</Text>
          <Text size="sm" c="dimmed">
            Genera un enlace de un solo uso y compártelo. Al registrarse quedará vinculado a ti.
          </Text>
          <form action={createInviteLinkForm}>
            <Button type="submit" size="md" fullWidth>
              Generar enlace de invitación
            </Button>
          </form>
        </Stack>
      </Paper>

      {athletes.length === 0 ? (
        <Text c="dimmed">Todavía no tienes deportistas.</Text>
      ) : (
        <Stack gap="sm">
          {athletes.map((athlete) => (
            <Card key={athlete.id} withBorder radius="md" padding="md">
              <Stack gap={4}>
                <Text fw={600}>{athlete.name ?? athlete.email}</Text>
                <Text size="sm" c="dimmed">
                  {athlete.email}
                </Text>
                {athlete.planName ? (
                  <Badge variant="light">{athlete.planName}</Badge>
                ) : (
                  <Badge variant="light" color="orange">
                    Sin plan asignado
                  </Badge>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Divider />

      <Group justify="space-between">
        <Title order={2} size="h3">
          Tus planes
        </Title>
        <Text size="sm" c="dimmed">
          {plans.length} activos
        </Text>
      </Group>

      {plans.length === 0 ? (
        <Text c="dimmed">Crea tu primer plan para empezar.</Text>
      ) : (
        <Stack gap="xs">
          {plans.map((plan) => (
            <Card key={plan.id} withBorder radius="md" padding="md">
              <Text fw={600}>{plan.name}</Text>
              {plan.description ? (
                <Text size="sm" c="dimmed">
                  {plan.description}
                </Text>
              ) : null}
            </Card>
          ))}
        </Stack>
      )}

      <Button component={Link} href="/coach/exercises" variant="light" size="md">
        Mis ejercicios y borradores
      </Button>
    </Stack>
  );
}
