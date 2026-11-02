import { Alert, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { inviteLinks, users } from "@/db/schema";
import { SignupForm } from "./signup-form";

export default async function SignupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [invite] = await db
    .select({ coachName: users.name, coachEmail: users.email })
    .from(inviteLinks)
    .innerJoin(users, eq(users.id, inviteLinks.coachId))
    .where(and(eq(inviteLinks.token, token), isNull(inviteLinks.usedAt)))
    .limit(1);

  return (
    <Container size={420} py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h2">
            Crea tu cuenta
          </Title>
          {invite ? (
            <Text c="dimmed" size="sm">
              Te invita {invite.coachName ?? invite.coachEmail}.
            </Text>
          ) : null}
        </Stack>

        {invite ? (
          <Paper withBorder p="md" radius="md">
            <SignupForm token={token} />
          </Paper>
        ) : (
          <Alert color="red" title="Invitación no válida">
            Este enlace ya se ha usado o ha caducado. Pide uno nuevo a tu entrenador.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
