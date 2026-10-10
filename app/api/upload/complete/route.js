import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2 } from "../../../../lib/r2";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isAuthorized } from "../../../../lib/auth";

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const { key, uploadId, parts, title, size, contentType } =
    await request.json();

  await r2.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );

  const { data, error } = await supabaseAdmin
    .from("videos")
    .insert({
      title,
      file_key: key,
      size_bytes: size,
      content_type: contentType,
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
