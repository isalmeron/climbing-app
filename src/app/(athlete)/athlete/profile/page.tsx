import { Button, NumberInput, Paper, Stack, Textarea, TextInput, Title } from "@mantine/core";
import { eq } from "drizzle-orm";
import { updateProfile } from "@/actions/profile";
import { db } from "@/db";
import { athleteProfiles, users } from "@/db/schema";
import { requireRole } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireRole("athlete");

  const [row] = await db
    .select({
      name: users.name,
      birthdate: athleteProfiles.birthdate,
      weightKg: athleteProfiles.weightKg,
      heightCm: athleteProfiles.heightCm,
      notes: athleteProfiles.notes,
    })
    .from(users)
    .leftJoin(athleteProfiles, eq(athleteProfiles.userId, users.id))
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        Mi perfil
      </Title>

      <Paper withBorder p="md" radius="md">
        <form action={updateProfile}>
          <Stack gap="sm">
            <TextInput name="name" label="Nombre" defaultValue={row?.name ?? ""} required size="md" />
            <TextInput
              name="birthdate"
              label="Fecha de nacimiento"
              type="date"
              defaultValue={row?.birthdate ?? ""}
              size="md"
            />
            <NumberInput
              name="weightKg"
              label="Peso (kg)"
              defaultValue={row?.weightKg ? Number(row.weightKg) : undefined}
              decimalScale={1}
              size="md"
            />
            <NumberInput name="heightCm" label="Altura (cm)" defaultValue={row?.heightCm ?? undefined} size="md" />
            <Textarea name="notes" label="Notas" defaultValue={row?.notes ?? ""} minRows={3} />
            <Button type="submit" size="md">
              Guardar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
