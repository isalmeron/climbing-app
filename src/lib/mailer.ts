import { Resend } from "resend";
import { env } from "@/lib/env";

export type Mail = { to: string; subject: string; text: string; html?: string };

export type Mailer = { send(mail: Mail): Promise<void> };

/** Dev transport: prints the mail so invite links are clickable locally. */
export const consoleMailer: Mailer = {
  async send(mail) {
    console.info(`\n[mail] to=${mail.to}\n[mail] subject=${mail.subject}\n\n${mail.text}\n`);
  },
};

function resendMailer(): Mailer {
  const { RESEND_API_KEY, MAIL_FROM } = env();
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  if (!MAIL_FROM) throw new Error("MAIL_FROM is not set");
  const client = new Resend(RESEND_API_KEY);

  return {
    async send(mail) {
      const { data, error } = await client.emails.send({
        from: MAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
      });
      if (error) throw new Error(`Resend send failed: ${error.message}`);
      console.info(`[mail] sent id=${data?.id} to=${mail.to}`);
    },
  };
}

export function mailer(): Mailer {
  return env().MAIL_TRANSPORT === "resend" ? resendMailer() : consoleMailer;
}

/** All user-facing copy is Spanish (ADR 0005). */
export function inviteEmail(inviteUrl: string): Mail["text"] {
  return `Te han invitado a Climbing Training.

Abre este enlace para crear tu cuenta:

${inviteUrl}

El enlace solo puede usarse una vez.`;
}

export function coachSetupEmail(setupUrl: string): Mail["text"] {
  return `Tu cuenta de entrenador ha sido creada.

Define tu contraseña aquí:

${setupUrl}`;
}

export function coachPasswordResetEmail(setupUrl: string): Mail["text"] {
  return `Se ha solicitado restablecer tu contraseña.

Define una nueva aquí:

${setupUrl}

El enlace solo puede usarse una vez.`;
}
