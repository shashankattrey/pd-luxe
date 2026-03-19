import pdf from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const data = await pdf(buffer);

    return Response.json({
      text: data.text,
    });
  } catch (err) {
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
