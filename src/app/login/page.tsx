import { Button, Container, Divider, Paper, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { loginWithFacebook, loginWithGoogle } from "@/actions/auth";
import { currentUser } from "@/lib/session";
import { CredentialsForm } from "./credentials-form";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(`/${user.role}`);

  return (
    <Container size={420} py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h2">
            Climbing Training
          </Title>
          <Text c="dimmed" size="sm">
            Entrena con un plan hecho por tu entrenador.
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md">
          <CredentialsForm />
        </Paper>

        <Divider label="o continúa con" labelPosition="center" />

        <Stack gap="sm">
          <form action={loginWithGoogle}>
            <Button type="submit" variant="default" fullWidth size="md">
              Google
            </Button>
          </form>
          <form action={loginWithFacebook}>
            <Button type="submit" variant="default" fullWidth size="md">
              Facebook
            </Button>
          </form>
        </Stack>

        <Text size="xs" c="dimmed" ta="center">
          El acceso es solo por invitación. Pide un enlace a tu entrenador.
        </Text>
      </Stack>
    </Container>
  );
}
