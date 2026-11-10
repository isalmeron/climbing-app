import { AppShell, AppShellHeader, AppShellMain, Button, Container, Group, Text } from "@mantine/core";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { LinkButton } from "@/components/link-button";
import { displayName } from "@/lib/name";
import { requireRole } from "@/lib/session";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireRole("coach");

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShellHeader>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Text fw={600}>Entrenador</Text>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {displayName(coach)}
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <LinkButton href="/coach" variant="subtle" size="compact-sm">
                Inicio
              </LinkButton>
              <form action={logout}>
                <Button type="submit" variant="subtle" size="compact-sm" color="gray">
                  Salir
                </Button>
              </form>
            </Group>
          </Group>
        </Container>
      </AppShellHeader>
      <AppShellMain>
        <Container size="lg">{children}</Container>
      </AppShellMain>
    </AppShell>
  );
}
