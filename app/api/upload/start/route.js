import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { r2 } from "../../../../lib/r2";
import { isAuthorized } from "../../../../lib/auth";

const ALLOWED_TYPES = [
  "video/",
  "audio/",
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isAllowedType(type) {
  return ALLOWED_TYPES.some((t) => type.startsWith(t));
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const { filename, contentType } = await request.json();
  if (!isAllowedType(contentType)) {
    return Response.json({ error: "File type not allowed" }, { status: 400 });
  }
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `videos/${randomUUID()}-${safeName}`;

  const result = await r2.send(
    new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
  );

  return Response.json({ uploadId: result.UploadId, key });
}
