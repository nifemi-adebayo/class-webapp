import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../../../../lib/r2";
import { isAuthorized } from "../../../../lib/auth";

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const { key, uploadId, partNumber } = await request.json();

  const url = await getSignedUrl(
    r2,
    new UploadPartCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: 3600 },
  );

  return Response.json({ url });
}
