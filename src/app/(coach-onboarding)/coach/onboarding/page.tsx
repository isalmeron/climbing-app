import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/actions/coaches";
import { OAuthConnect } from "@/components/oauth-connect";
import { requireRole } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function CoachOnboardingPage() {
  const coach = await requireRole("coach");
  // Mandatory: every redirect to /coach lands here until the name is set.
  if (coach.firstName && coach.lastName) redirect("/coach");

  return (
    <Stack gap="lg" py="md">
      <Stack gap={4}>
        <Title order={1} size="h2">
          Completa tu perfil
        </Title>
        <Text c="dimmed" size="sm">
          Antes de empezar, dinos quién eres. Vincular una cuenta es opcional.
        </Text>
      </Stack>

      <Card withBorder radius="md" padding="md">
        <OnboardingForm action={completeOnboarding} />
      </Card>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Vincula tus cuentas (opcional): servirán para entrar sin contraseña.
        </Text>
        <OAuthConnect providers={["google", "facebook"]} />
      </Stack>

      <Group justify="center" visibleFrom="sm" />
    </Stack>
  );
}
