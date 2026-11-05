"use client";

import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { useActionState } from "react";
import { completeCoachSetup } from "@/actions/coaches";

export function CoachSetupForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(completeCoachSetup, undefined);

  return (
    <form action={formAction}>
      <Stack gap="sm">
        <input type="hidden" name="token" value={token} />
        {state?.error ? <Alert color="red">{state.error}</Alert> : null}
        <PasswordInput
          name="password"
          label="Contraseña"
          description="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
          size="md"
        />
        <Button type="submit" loading={pending} fullWidth size="md">
          Crear contraseña
        </Button>
      </Stack>
    </form>
  );
}
