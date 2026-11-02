"use client";

import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useActionState } from "react";
import { loginWithCredentials } from "@/actions/auth";

export function CredentialsForm() {
  const [state, formAction, pending] = useActionState(loginWithCredentials, undefined);

  return (
    <form action={formAction}>
      <Stack gap="sm">
        {state?.error ? <Alert color="red">{state.error}</Alert> : null}
        <TextInput
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          size="md"
        />
        <PasswordInput
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          size="md"
        />
        <Button type="submit" loading={pending} fullWidth size="md">
          Entrar
        </Button>
      </Stack>
    </form>
  );
}
