import { Badge, Button, Card, Group, Progress, Stack, Text, Title } from "@mantine/core";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { completeSession } from "@/actions/logs";
import { db } from "@/db";
import { logs, planAssignments, planWeeks, trainingPlans, trainingSessions } from "@/db/schema";
import { requireRole } from "@/lib/session";

export default async function AthleteHome() {
  const athlete = await requireRole("athlete");

  const [assignment] = await db
    .select({ planId: trainingPlans.id, planName: trainingPlans.name })
    .from(planAssignments)
    .innerJoin(trainingPlans, eq(trainingPlans.id, planAssignments.planId))
    .where(and(eq(planAssignments.athleteId, athlete.id), isNull(planAssignments.archivedAt)))
    .limit(1);

  if (!assignment) {
    return (
      <Stack gap="sm" py="xl">
        <Title order={1} size="h2">
          Aún no tienes plan
        </Title>
        <Text c="dimmed">Tu entrenador todavía no te ha asignado un plan de entrenamiento.</Text>
      </Stack>
    );
  }

  const weeks = await db
    .select()
    .from(planWeeks)
    .where(eq(planWeeks.planId, assignment.planId))
    .orderBy(asc(planWeeks.position));

  const sessions =
    weeks.length > 0
      ? await db
          .select()
          .from(trainingSessions)
          .where(
            inArray(
              trainingSessions.weekId,
              weeks.map((w) => w.id),
            ),
          )
          .orderBy(asc(trainingSessions.position))
      : [];

  const completed = await db.select({ sessionId: logs.sessionId }).from(logs).where(eq(logs.athleteId, athlete.id));
  const done = new Set(completed.map((c) => c.sessionId));

  return (
    <Stack gap="lg">
      <Stack gap={2}>
        <Text size="sm" c="dimmed">
          Plan activo
        </Text>
        <Title order={1} size="h2">
          {assignment.planName}
        </Title>
      </Stack>

      {weeks.map((week) => {
        const weekSessions = sessions.filter((s) => s.weekId === week.id);
        const weekDone = weekSessions.filter((s) => done.has(s.id)).length;
        const pct = weekSessions.length ? (weekDone / weekSessions.length) * 100 : 0;

        return (
          <Stack key={week.id} gap="xs">
            <Group justify="space-between">
              <Text fw={600}>{week.name ?? `Semana ${week.position}`}</Text>
              <Badge variant="light">
                {weekDone}/{weekSessions.length}
              </Badge>
            </Group>
            <Progress value={pct} size="sm" />

            {weekSessions.map((session) => {
              const isDone = done.has(session.id);
              return (
                <Card key={session.id} withBorder radius="md" padding="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0}>
                      <Text fw={500}>{session.name ?? `Sesión ${session.position}`}</Text>
                      <Text size="xs" c="dimmed">
                        {isDone ? "Completada" : "Pendiente"}
                      </Text>
                    </Stack>
                    {isDone ? (
                      <Badge color="teal">Hecha</Badge>
                    ) : (
                      <form action={completeSession.bind(null, session.id)}>
                        <Button type="submit" size="compact-md">
                          Marcar completada
                        </Button>
                      </form>
                    )}
                  </Group>
                </Card>
              );
            })}
            {weekSessions.length === 0 ? (
              <Text size="sm" c="dimmed">
                Esta semana no tiene sesiones.
              </Text>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
