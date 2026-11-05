/**
 * Canonical identity is `first_name` + `last_name` on `users`. The Auth.js
 * `name` column is its mirror of the OAuth profile and is only a fallback.
 */

export type NamedPerson = {
  firstName: string | null;
  lastName: string | null;
  name?: string | null;
  email: string;
};

/** "first last", falling back to the Auth.js mirror, then the email. */
export function displayName(person: NamedPerson): string {
  const full = [person.firstName, person.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();
  return full || person.name || person.email;
}

/** Split an OAuth full name on the first space; single-token names have no last name. */
export function splitFullName(full?: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!full?.trim()) return { firstName: null, lastName: null };
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}
