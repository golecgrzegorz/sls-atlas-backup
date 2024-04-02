const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { execSync} = require('child_process');
const { uploadToS3 } = require('./libs/s3');
const fs = require("fs");

const sqsClient = new SQSClient();

module.exports.backup = async (_event, _context) => {
  const databasesToBackup = process.env.MONGOURIS_TO_BACKUP?.split(',');
  if (!databasesToBackup?.length){
    return;
  }

  try {
    for (const databaseURI of databasesToBackup) {
      const uri = new URL(databaseURI);
      const databaseName = uri.pathname.split('/').pop();
      uri.searchParams.append('authSource', '$external');
      uri.searchParams.append('authMechanism', 'MONGODB-AWS');

      const message = new SendMessageCommand({
        MessageBody: JSON.stringify({
          databaseName,
          databaseURI: uri.href
        }),
        QueueUrl: process.env.SQS_DUMP_QUEUE_URL,
        MessageAttributes: {}
       });

      await sqsClient.send(message);
    }
  } catch (error) {
    console.error('>>> ERR :: SQS sendMessage error', error.message);
  }

};

module.exports.dumpDatabaseToS3SQS = async (event, _context) => {
  try {
    for (let record of event.Records) {
      const body = JSON.parse(record.body);

      const [date, _time] = (new Date()).toISOString().split('T');
      const dbName = body.databaseName.toLowerCase();
      const path = `/tmp/dump-${dbName}-${date}.db`;
      execSync(`/opt/mongodump '${body.databaseURI}' --gzip --archive=${path} --quiet`, { stdio: 'inherit', encoding: 'utf8' });

      await uploadToS3({
        Bucket: process.env.BUCKET,
        Key: `${dbName}-${date}.db`,
        Body: fs.createReadStream(path)
      });
    }
  } catch (error) {
    console.error('>>> ERR :: mongodump error', error.message);
  }

};