import { AppShell, Button, Container, Group, Text } from "@mantine/core";
import { logout } from "@/actions/auth";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/session";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const athlete = await requireRole("athlete");

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container h="100%" size="md">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Text fw={600} truncate>
              {athlete.name ?? "Mi entrenamiento"}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <LinkButton href="/athlete/profile" variant="subtle" size="compact-sm">
                Perfil
              </LinkButton>
              <form action={logout}>
                <Button type="submit" variant="subtle" size="compact-sm" color="gray">
                  Salir
                </Button>
              </form>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
