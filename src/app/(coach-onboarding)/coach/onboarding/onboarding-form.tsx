"use client";

import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { useActionState } from "react";
import { updateAvatar } from "@/actions/coaches";
import { AvatarUpload } from "@/components/avatar-upload";

type OnboardingAction = (
  prev: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string } | undefined>;

export function OnboardingForm({ action }: { action: OnboardingAction }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <Stack gap="sm">
        {state?.error ? <Alert color="red">{state.error}</Alert> : null}
        <Group grow>
          <TextInput name="firstName" label="Nombre" required size="md" />
          <TextInput name="lastName" label="Apellidos" required size="md" />
        </Group>
        <AvatarUpload fallbackLabel="" onSaved={updateAvatar} />
        <Button type="submit" loading={pending} fullWidth size="md">
          Guardar y continuar
        </Button>
      </Stack>
    </form>
  );
}
