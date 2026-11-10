import { Badge, Button, Card, Group, Select, Stack, Text, Title } from "@mantine/core";
import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { transferAthleteFromForm } from "@/actions/athletes";
import { setUserActive } from "@/actions/users";
import { LinkButton } from "@/components/link-button";
import { db } from "@/db";
import { athleteCoach, users } from "@/db/schema";
import { displayName } from "@/lib/name";
import { requireRole } from "@/lib/session";

const coaches = alias(users, "coaches");

export default async function AdminAthletesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("admin");
  const showDeactivated = (await searchParams).deactivated === "1";

  const [athletes, activeCoaches] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        deactivatedAt: users.deactivatedAt,
        coachId: athleteCoach.coachId,
        coachFirstName: coaches.firstName,
        coachLastName: coaches.lastName,
        coachName: coaches.name,
      })
      .from(users)
      .leftJoin(athleteCoach, eq(athleteCoach.athleteId, users.id))
      .leftJoin(coaches, eq(coaches.id, athleteCoach.coachId))
      .where(showDeactivated ? eq(users.role, "athlete") : and(eq(users.role, "athlete"), isNull(users.deactivatedAt)))
      .orderBy(asc(users.createdAt)),
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
      })
      .from(users)
      .where(and(eq(users.role, "coach"), isNull(users.deactivatedAt)))
      .orderBy(asc(users.createdAt)),
  ]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Title order={1} size="h2">
          Atletas
        </Title>
        <LinkButton
          href={showDeactivated ? "/admin/athletes" : "/admin/athletes?deactivated=1"}
          variant="subtle"
          size="compact-sm"
        >
          {showDeactivated ? "Ver activos" : "Ver desactivados"}
        </LinkButton>
      </Group>

      <Stack gap="xs">
        {athletes.length === 0 ? (
          <Text c="dimmed" size="sm">
            No hay atletas{showDeactivated ? " desactivados" : ""}.
          </Text>
        ) : (
          athletes.map((athlete) => {
            const deactivated = !!athlete.deactivatedAt;
            const options = activeCoaches
              .filter((coach) => coach.id !== athlete.coachId)
              .map((coach) => ({ value: coach.id, label: displayName(coach) }));

            return (
              <Card key={athlete.id} withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0}>
                      <Text fw={500}>{displayName(athlete)}</Text>
                      <Text size="sm" c="dimmed">
                        {athlete.email}
                      </Text>
                    </Stack>
                    <Group gap="xs" wrap="nowrap">
                      {deactivated ? (
                        <>
                          <Badge variant="light" color="gray">
                            Desactivado
                          </Badge>
                          <form action={setUserActive.bind(null, athlete.id, true)}>
                            <Button type="submit" variant="subtle" size="compact-sm" color="teal">
                              Reactivar
                            </Button>
                          </form>
                        </>
                      ) : (
                        <>
                          <Text size="sm" c="dimmed">
                            {athlete.coachId
                              ? `Entrenador: ${displayName({
                                  firstName: athlete.coachFirstName,
                                  lastName: athlete.coachLastName,
                                  name: athlete.coachName,
                                  email: athlete.email,
                                })}`
                              : "Sin entrenador"}
                          </Text>
                          <form action={setUserActive.bind(null, athlete.id, false)}>
                            <Button type="submit" variant="subtle" size="compact-sm" color="red">
                              Desactivar
                            </Button>
                          </form>
                        </>
                      )}
                    </Group>
                  </Group>

                  {!deactivated && options.length > 0 ? (
                    <form action={transferAthleteFromForm}>
                      <input type="hidden" name="athleteId" value={athlete.id} />
                      <Group align="flex-end" gap="sm" wrap="nowrap">
                        <Select
                          name="coachId"
                          label="Nuevo entrenador"
                          placeholder="Elige un entrenador"
                          data={options}
                          required
                          size="sm"
                          style={{ flex: 1 }}
                        />
                        <Button type="submit" size="sm">
                          Transferir
                        </Button>
                      </Group>
                    </form>
                  ) : null}
                </Stack>
              </Card>
            );
          })
        )}
      </Stack>
    </Stack>
  );
}
