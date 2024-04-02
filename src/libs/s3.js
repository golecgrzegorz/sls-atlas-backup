const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client();
async function uploadToS3(params) {
  return s3Client.send(new PutObjectCommand(params));
}

module.exports = {
  uploadToS3
}