"use client";

import { Button, type ButtonProps } from "@mantine/core";
import Link from "next/link";
import type { ComponentProps } from "react";

type NextLinkProps = Omit<ComponentProps<typeof Link>, "href">;

/**
 * Mantine `Button` that navigates with the Next.js router.
 *
 * Mantine renders its components on the client, so using `Button` with
 * `component={Link}` straight from a Server Component means passing a component
 * reference through the server/client boundary. Wrapping it here keeps pages
 * and layouts as Server Components while the button itself is a client
 * component:
 *
 *   <LinkButton href="/coach/plans" size="md">Planes</LinkButton>
 *
 * For actions that run server code (logout, marking a session complete) keep
 * using a plain `Button` inside a `<form action={serverAction}>`.
 */
export type LinkButtonProps = Omit<ButtonProps, "component" | "href"> &
  NextLinkProps & {
    href: string;
    /** Opens the target in a new tab; adds noopener/noreferrer automatically. */
    newTab?: boolean;
  };

export function LinkButton({ href, newTab, ...others }: LinkButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...others}
    />
  );
}
