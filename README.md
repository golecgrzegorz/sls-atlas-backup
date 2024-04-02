

# Automatic S3 backup for Mongo Atlas free shared clusters

This service demonstrate how to use AWS Lambda, Lambda Layers, SQS and S3 to back up 
Mongo Atlas free shared cluster databases where the backup is not available on the free plan (M0 instances).
It uses Serverless js framework as AWS orchestration tool.  

## Overview

Check `serverless.yml` for details.

### Use mongodump binary
I want to use `mongodump` tool, so it will be best to create a lambda layer with this binary, then I can freely access
it from any Lambda.

### Use MongoDB uri with `MONGODB-AWS` authMechanism
To not expose db credentials when calling `mongodump` from AWS Lambda I will use [Authentication with AWS IAM](https://www.mongodb.com/docs/atlas/security/passwordless-authentication/#set-up-passwordless-authentication-with-aws-iam) also good to know MongoDB connection string format [connection strings](https://www.mongodb.com/docs/master/reference/connection-string/#std-label-connections-string-example-mongodb-aws).

When configured correctly we can only call `mongodump 'mongodb+srv://<cluster>.mongodb.net/<dbName>?authSource=$external&authMechanism=MONGODB-AWS' --gzip --archive=/tmp/dump-${dbName}-${date}.db --quiet` to dump selected database.
Please be aware that Lambda can store a 512 MB temporary file system in `/tmp` directory. With additional config you 
can store up to 10GB [AWS Lambda Now Supports Up to 10 GB Ephemeral Storage](https://aws.amazon.com/blogs/aws/aws-lambda-now-supports-up-to-10-gb-ephemeral-storage/).

### Use .env file to define mongo uris to backup
Check `.env.example` to see how to define uris, rename it to `.env` before deploying. To define multiple uris just 
separate them with comas `,`.  

### The rest is pretty clear

- I define lambda to pass mongo uris to the SQS via lambda 
- I define scheduler to call above lambda every 24h
- I define SQS lambda handler to dump dbs using binary and upload them to private S3 bucket

#### TODO:
You can define DLQ (Dead Letter Queue) for your SQS to have to handle unexpected errors.  

### How to deploy

I have multiple AWS credentials defined locally that's why Iam using serverless.js `profile` option to select preferred credentials.

```yaml
  profile: global-lambdas
```

```bash
    npm run deploy:dev
```
 OR

```bash
    npm run deploy:prod
```
