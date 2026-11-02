import { AppShell, Button, Container, Group, Text } from "@mantine/core";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireRole } from "@/lib/session";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireRole("coach");

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Text fw={600}>Entrenador</Text>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {coach.name ?? coach.email}
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Button component={Link} href="/coach" variant="subtle" size="compact-sm">
                Inicio
              </Button>
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
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
