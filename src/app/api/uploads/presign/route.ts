import { presignExerciseUpload } from "@/lib/s3";
import { currentUser } from "@/lib/session";

/** Only coaches and admins upload demos; the browser PUTs directly to S3. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || (user.role !== "coach" && user.role !== "admin")) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { contentType?: string; size?: number; filename?: string };
  if (!body.contentType || !body.size || !body.filename) {
    return Response.json({ error: "Faltan datos" }, { status: 400 });
  }

  try {
    const result = await presignExerciseUpload({
      contentType: body.contentType,
      size: body.size,
      filename: body.filename,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
