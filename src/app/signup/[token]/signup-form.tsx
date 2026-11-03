"use client";

import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useActionState } from "react";
import { signUpWithInvite } from "@/actions/auth";

export function SignupForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(signUpWithInvite, undefined);

  return (
    <form action={formAction}>
      <Stack gap="sm">
        <input type="hidden" name="token" value={token} />
        {state?.error ? <Alert color="red">{state.error}</Alert> : null}
        <TextInput name="name" label="Nombre" autoComplete="name" required size="md" />
        <TextInput name="email" label="Email" type="email" autoComplete="email" required size="md" />
        <PasswordInput
          name="password"
          label="Contraseña"
          description="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
          size="md"
        />
        <Button type="submit" loading={pending} fullWidth size="md">
          Crear cuenta
        </Button>
      </Stack>
    </form>
  );
}
