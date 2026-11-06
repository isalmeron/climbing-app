import { AppShell, AppShellHeader, AppShellMain, Button, Container, Group, Text } from "@mantine/core";
import { logout } from "@/actions/auth";
import { LinkButton } from "@/components/link-button";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShellHeader>
        <Container h="100%" size="lg">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <Text fw={600}>Administración</Text>
              <LinkButton href="/admin" variant="subtle" size="compact-sm">
                Cola
              </LinkButton>
              <LinkButton href="/admin/catalog" variant="subtle" size="compact-sm">
                Catálogo
              </LinkButton>
              <LinkButton href="/admin/tags" variant="subtle" size="compact-sm">
                Etiquetas
              </LinkButton>
            </Group>
            <form action={logout}>
              <Button type="submit" variant="subtle" size="compact-sm" color="gray">
                Salir
              </Button>
            </form>
          </Group>
        </Container>
      </AppShellHeader>
      <AppShellMain>
        <Container size="lg">{children}</Container>
      </AppShellMain>
    </AppShell>
  );
}
