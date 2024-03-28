const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require("fs");

const s3Client = new S3Client();
async function uploadToS3(key, filePath) {
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
    Body: fs.createReadStream(filePath),
  });
  await s3Client.send(command);
}

module.exports = {
  uploadToS3
}