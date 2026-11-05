"use client";

import { Button, Group } from "@mantine/core";
import { signIn } from "next-auth/react";

/**
 * Shared OAuth linking — used on coach onboarding and on the profile page.
 * Signing in with a provider while authenticated links the account (Auth.js).
 */
export function OAuthConnect({ providers }: { providers: Array<"google" | "facebook"> }) {
  return (
    <Group gap="sm" grow>
      {providers.includes("google") ? (
        <Button variant="default" size="md" onClick={() => signIn("google", { redirectTo: "/coach" })}>
          Conectar Google
        </Button>
      ) : null}
      {providers.includes("facebook") ? (
        <Button variant="default" size="md" onClick={() => signIn("facebook", { redirectTo: "/coach" })}>
          Conectar Facebook
        </Button>
      ) : null}
    </Group>
  );
}
