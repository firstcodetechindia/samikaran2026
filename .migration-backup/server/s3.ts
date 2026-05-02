import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import * as path from "path";
import { storage } from "./storage";

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

let cachedConfig: S3Config | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000;

export async function getS3Config(): Promise<S3Config | null> {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig;
  }

  const [providerSetting, bucketSetting, regionSetting, accessKeySetting, secretKeySetting] = await Promise.all([
    storage.getSetting("storage_provider"),
    storage.getSetting("storage_bucket"),
    storage.getSetting("storage_region"),
    storage.getSetting("storage_access_key"),
    storage.getSetting("storage_secret_key"),
  ]);

  if (providerSetting?.value !== "s3") {
    cachedConfig = null;
    return null;
  }

  const accessKeyId = accessKeySetting?.value;
  const secretAccessKey = secretKeySetting?.value;
  const bucket = bucketSetting?.value;
  const region = regionSetting?.value;

  if (!accessKeyId || !secretAccessKey || !bucket || !region) {
    cachedConfig = null;
    return null;
  }

  cachedConfig = { accessKeyId, secretAccessKey, bucket, region };
  cacheTimestamp = now;
  return cachedConfig;
}

export function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export type UploadFolder =
  | "studentsprofile"
  | "students-id"
  | "samikaran-asstes/images"
  | "samikaran-asstes/css"
  | "samikaran-asstes/scripts"
  | "samikaran-asstes/docs"
  | "uploads";

export async function uploadToS3(
  file: Express.Multer.File,
  folder: UploadFolder = "uploads"
): Promise<{ objectPath: string; url: string; key: string }> {
  const config = await getS3Config();
  if (!config) {
    throw new Error("S3 not configured. Go to Super Admin → Global Settings → Storage to configure Amazon S3.");
  }

  const client = createS3Client(config);
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
  const key = `${folder}/${randomUUID()}_${sanitizedName}`;

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: "public, max-age=31536000",
  }));

  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  return { objectPath: url, url, key };
}

export async function deleteFromS3(fileUrl: string): Promise<boolean> {
  const config = await getS3Config();
  if (!config) return false;

  try {
    const bucketDomain = `https://${config.bucket}.s3.${config.region}.amazonaws.com/`;
    if (!fileUrl.startsWith(bucketDomain)) return false;

    const key = fileUrl.replace(bucketDomain, "");
    const client = createS3Client(config);
    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error("Failed to delete from S3:", error);
    return false;
  }
}

export async function getS3Stats(): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  folders: { name: string; fileCount: number; sizeBytes: number; subfolders?: { name: string; fileCount: number; sizeBytes: number }[] }[];
} | null> {
  const config = await getS3Config();
  if (!config) return null;

  try {
    const client = createS3Client(config);
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));

    let totalFiles = 0;
    let totalSizeBytes = 0;
    const folderMap = new Map<string, { fileCount: number; sizeBytes: number; subfolders: Map<string, { fileCount: number; sizeBytes: number }> }>();
    let continuationToken: string | undefined;

    do {
      const response = await client.send(new ListObjectsV2Command({
        Bucket: config.bucket,
        ContinuationToken: continuationToken,
      }));

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!obj.Key || obj.Key.endsWith("/")) continue;
          totalFiles++;
          const size = obj.Size || 0;
          totalSizeBytes += size;

          const parts = obj.Key.split("/");
          const topFolder = parts[0] || "root";
          const subFolder = parts.length > 2 ? parts[1] : null;

          if (!folderMap.has(topFolder)) {
            folderMap.set(topFolder, { fileCount: 0, sizeBytes: 0, subfolders: new Map() });
          }
          const folder = folderMap.get(topFolder)!;
          folder.fileCount++;
          folder.sizeBytes += size;

          if (subFolder) {
            if (!folder.subfolders.has(subFolder)) {
              folder.subfolders.set(subFolder, { fileCount: 0, sizeBytes: 0 });
            }
            const sub = folder.subfolders.get(subFolder)!;
            sub.fileCount++;
            sub.sizeBytes += size;
          }
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    const predefinedFolders = [
      { name: "studentsprofile", subfolders: [] },
      { name: "students-id", subfolders: [] },
      { name: "samikaran-asstes", subfolders: ["images", "css", "scripts", "docs"] },
    ];

    for (const pf of predefinedFolders) {
      if (!folderMap.has(pf.name)) {
        const subs = new Map<string, { fileCount: number; sizeBytes: number }>();
        for (const sf of pf.subfolders) {
          subs.set(sf, { fileCount: 0, sizeBytes: 0 });
        }
        folderMap.set(pf.name, { fileCount: 0, sizeBytes: 0, subfolders: subs });
      } else if (pf.subfolders.length > 0) {
        const existing = folderMap.get(pf.name)!;
        for (const sf of pf.subfolders) {
          if (!existing.subfolders.has(sf)) {
            existing.subfolders.set(sf, { fileCount: 0, sizeBytes: 0 });
          }
        }
      }
    }

    const folders = Array.from(folderMap.entries()).map(([name, data]) => ({
      name,
      fileCount: data.fileCount,
      sizeBytes: data.sizeBytes,
      subfolders: data.subfolders.size > 0
        ? Array.from(data.subfolders.entries()).map(([subName, subData]) => ({
            name: subName,
            ...subData,
          })).sort((a, b) => b.sizeBytes - a.sizeBytes)
        : undefined,
    })).sort((a, b) => b.sizeBytes - a.sizeBytes);

    return { totalFiles, totalSizeBytes, folders };
  } catch (error) {
    console.error("Failed to get S3 stats:", error);
    return null;
  }
}

export function clearS3ConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
