/**
 * Seeds the bootstrap admin (ADR 0005), the tag vocabulary, and a starter
 * catalog so a coach can compose a first plan at cold start (ADR 0003).
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, exerciseTags, tags, users } from "@/db/schema";
import { TAG_VOCABULARY } from "@/lib/tag-vocabulary";

const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
}

const passwordHash = await bcrypt.hash(adminPassword, 10);

await db
  .insert(users)
  .values({ email: adminEmail.toLowerCase(), name: "Admin", role: "admin", passwordHash })
  .onConflictDoUpdate({
    target: users.email,
    set: { role: "admin", passwordHash },
  });

for (const [index, tag] of TAG_VOCABULARY.entries()) {
  await db
    .insert(tags)
    .values({ key: tag.key, labelEs: tag.label, sort: index })
    .onConflictDoUpdate({ target: tags.key, set: { labelEs: tag.label, sort: index } });
}

const tagRows = await db.select().from(tags);
const tagId = (key: string) => tagRows.find((t) => t.key === key)?.id;

const STARTER = [
  {
    name: "Repetidores en regleta",
    description:
      "7 segundos colgado + 3 de descanso, repetido 6 veces por serie. Trabaja resistencia de antebrazo.",
    tags: ["fingers", "forearm", "endurance"],
  },
  {
    name: "Dominadas lastradas",
    description: "Tracción vertical con lastre progresivo. Baja controlada de 3 segundos.",
    tags: ["pull", "upper-body", "power"],
  },
  {
    name: "4x4 en plafón",
    description: "Cuatro bloques encadenados, cuatro rondas con 4 minutos de descanso.",
    tags: ["endurance", "technique"],
  },
  {
    name: "Campus board básico",
    description: "Saltos a presas grandes con ambos brazos. Foco en precisión y aterrizaje suave.",
    tags: ["power", "fingers"],
  },
  {
    name: "Flexiones en anillas",
    description: "Empuje horizontal con estabilización de hombro. Codos a 45 grados.",
    tags: ["push", "shoulders", "upper-body"],
  },
  {
    name: "Plancha frontal",
    description: "Isométrico de core, 30-45 segundos por serie, sin perder la línea lumbar.",
    tags: ["core"],
  },
  {
    name: "Movilidad de cadera",
    description: "Secuencia de apertura de cadera y tobillo antes de la sesión.",
    tags: ["mobility"],
  },
  {
    name: "Técnica de taloneo",
    description: "Bloques fáciles prestando atención a la colocación precisa del pie.",
    tags: ["technique"],
  },
];

for (const starter of STARTER) {
  const [existing] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.name, starter.name))
    .limit(1);
  if (existing) continue;

  const [created] = await db
    .insert(exercises)
    .values({
      name: starter.name,
      description: starter.description,
      status: "accepted",
      acceptedAt: new Date(),
    })
    .returning();

  if (!created) continue;

  const ids = starter.tags.map(tagId).filter((id): id is string => Boolean(id));
  if (ids.length > 0) {
    await db.insert(exerciseTags).values(ids.map((id) => ({ exerciseId: created.id, tagId: id })));
  }
}

console.info("Seed completado");
