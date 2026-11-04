/**
 * Guard for the AGENTS.md convention: Mantine compound components
 * (`AppShell.Header`) must be written in the flat form (`AppShellHeader`).
 *
 * Flags JSX tags of the shape `<Something.Sub>` / `</Something.Sub>` under
 * src/ where `Something` is imported from an `@mantine/*` package, so React
 * members (`React.Suspense`) and non-Mantine namespaces pass.
 *
 * Run automatically as part of `pnpm lint`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const JSX_TAG = /<\/?([A-Z][A-Za-z0-9]*)\.[A-Za-z][A-Za-z0-9]*[ />]/g;
const MANTINE_IMPORT = /import\s*(?:type\s*)?{([^}]*)}\s*from\s*"@mantine\/[a-z]+"/g;

function mantineNames(source) {
  const names = new Set();
  for (const match of source.matchAll(MANTINE_IMPORT)) {
    for (const spec of match[1].split(",")) {
      const name = spec
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

const violations = [];
for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  const names = mantineNames(source);
  if (names.size === 0) continue;

  source.split("\n").forEach((line, i) => {
    for (const match of line.matchAll(JSX_TAG)) {
      if (names.has(match[1])) {
        violations.push({
          file: file.replace(`${ROOT}/`, "src/"),
          line: i + 1,
          text: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(
    `✗ Mantine compound JSX found (${violations.length}). Use the flat ComponentXXX form — see AGENTS.md:\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  process.exit(1);
}

console.log("✓ No compound Mantine JSX — flat ComponentXXX form everywhere.");
