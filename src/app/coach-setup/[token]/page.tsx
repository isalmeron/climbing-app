import { Alert, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { coachSetupTokens, users } from "@/db/schema";
import { currentUser } from "@/lib/session";
import { CoachSetupForm } from "./setup-form";

export default async function CoachSetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await currentUser();
  if (user) redirect(`/${user.role}`);

  const [valid] = await db
    .select({ email: users.email })
    .from(coachSetupTokens)
    .innerJoin(users, eq(users.id, coachSetupTokens.userId))
    .where(and(eq(coachSetupTokens.token, token), isNull(coachSetupTokens.usedAt)))
    .limit(1);

  return (
    <Container size={420} py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h2">
            Configura tu cuenta
          </Title>
          {valid ? (
            <Text c="dimmed" size="sm">
              Cuenta: {valid.email}
            </Text>
          ) : null}
        </Stack>

        {valid ? (
          <Paper withBorder p="md" radius="md">
            <CoachSetupForm token={token} />
          </Paper>
        ) : (
          <Alert color="red" title="Enlace no válido">
            Este enlace ya se ha usado o no existe. Pide uno nuevo al administrador.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
