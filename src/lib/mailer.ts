import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "@/lib/env";

export type Mail = { to: string; subject: string; text: string; html?: string };

export type Mailer = { send(mail: Mail): Promise<void> };

/** Dev transport: prints the mail so invite links are clickable locally. */
export const consoleMailer: Mailer = {
  async send(mail) {
    console.info(`\n[mail] to=${mail.to}\n[mail] subject=${mail.subject}\n\n${mail.text}\n`);
  },
};

function sesMailer(): Mailer {
  const { AWS_REGION, SES_FROM } = env();
  if (!SES_FROM) throw new Error("SES_FROM is not set");
  const client = new SESClient({ region: AWS_REGION });

  return {
    async send(mail) {
      await client.send(
        new SendEmailCommand({
          Source: SES_FROM,
          Destination: { ToAddresses: [mail.to] },
          Message: {
            Subject: { Data: mail.subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: mail.text, Charset: "UTF-8" },
              ...(mail.html ? { Html: { Data: mail.html, Charset: "UTF-8" } } : {}),
            },
          },
        }),
      );
    },
  };
}

export function mailer(): Mailer {
  return env().MAIL_TRANSPORT === "ses" ? sesMailer() : consoleMailer;
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
