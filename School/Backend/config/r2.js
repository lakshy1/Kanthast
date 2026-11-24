import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 speaks the S3 protocol. The bucket is private: nothing in it is reachable
// except through links this server signs after it has checked who is asking.
let client;

export function r2Config() {
  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const bucket = (process.env.R2_BUCKET || "").trim();
  const accessKeyId = (process.env.R2_SCHOOL_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SCHOOL_SECRET_ACCESS_KEY || "").trim();
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Video storage is not configured (R2_ACCOUNT_ID, R2_BUCKET, R2_SCHOOL_ACCESS_KEY_ID, R2_SCHOOL_SECRET_ACCESS_KEY).");
  }
  return { accountId, bucket, accessKeyId, secretAccessKey };
}

export function r2() {
  if (!client) {
    const { accountId, accessKeyId, secretAccessKey } = r2Config();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}
