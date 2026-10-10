import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../../../../lib/r2";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isAuthorized } from "../../../../lib/auth";

export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }

  const { id } = await params;

  const { data: file } = await supabaseAdmin
    .from("videos")
    .select("file_key")
    .eq("id", id)
    .single();

  if (!file) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: file.file_key,
    }),
  );

  const { error } = await supabaseAdmin.from("videos").delete().eq("id", id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
