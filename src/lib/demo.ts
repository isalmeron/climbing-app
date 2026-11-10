/**
 * Pure rules for an exercise's demo media. Spanish error strings come back so
 * Server Actions and client forms surface the same message.
 */
export type DemoInput = {
  demoType?: "upload" | "embed" | null;
  demoUrl?: string | null;
  demoKey?: string | null;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateDemoInput(demo: DemoInput): string | null {
  if (demo.demoType === "embed") {
    if (!demo.demoUrl) return "Introduce la URL del vídeo de demostración";
    if (!isHttpUrl(demo.demoUrl)) return "La URL de la demostración debe empezar por https://";
    return null;
  }
  if (demo.demoType === "upload") {
    if (!demo.demoUrl || !demo.demoKey) return "Sube el archivo de demostración o elige la opción de URL";
    return null;
  }
  if (demo.demoUrl || demo.demoKey) return "Selecciona el tipo de demostración";
  return null;
}
