
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const config = getBucketConfig();

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const key = `${config.folderPrefix}recordings/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'audio/webm'
  });

  await s3Client.send(command);
  return key; // Return cloud_storage_path
}

export async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key
  });

  await s3Client.send(command);
}

export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  // S3 doesn't support rename, so we copy and delete
  const downloadUrl = await downloadFile(oldKey);
  
  // This is a simplified implementation - in production you'd stream the data
  const response = await fetch(downloadUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  const finalKey = await uploadFile(buffer, newKey);
  await deleteFile(oldKey);
  
  return finalKey;
}
