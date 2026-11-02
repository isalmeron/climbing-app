import { AppShell, Button, Container, Group, Text } from "@mantine/core";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <Text fw={600}>Administración</Text>
              <Button component={Link} href="/admin" variant="subtle" size="compact-sm">
                Cola
              </Button>
              <Button component={Link} href="/admin/tags" variant="subtle" size="compact-sm">
                Etiquetas
              </Button>
            </Group>
            <form action={logout}>
              <Button type="submit" variant="subtle" size="compact-sm" color="gray">
                Salir
              </Button>
            </form>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
