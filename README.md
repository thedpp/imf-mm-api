# imf-mm-api

A node server to implement the IMF Media Management API with a choice of databases

## installation

### to just run the code

* install node 8.10 or above
* create a `.env` file with how you want to run the code and credentials for AWS  if you
  are going to use AWS SimpleDB as your database

```bash
# run time environment variables for imf-mm-api
#
# what mode are we in? Uncomment one of these
#
NODE_ENV=development
#NODE_ENV=staging
#NODE_ENV=beta
#NODE_ENV=production
export NODE_ENV
#
# AWS keys to access your buckets and SimpleDB if you use your own cloud AWS SimpleDB database
#
AWS_ACCESS_KEY_ID=XxXxXxXxXxXxXxXxXxXx
AWS_SECRET_ACCESS_KEY=ZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
```

* clone (or download and unzip) the repository into a folder
* `cd` into that folder
* install dependencies `npm install --production`
* check the config file based on the value of `NODE_ENV` in `.env`
* start the server
  * one off run: `npm start`
  * monitor & restart on error by [installing pm2](https://pm2.io/doc/)
   `npm install pm2` and then `pm2 start src/start_local`

### to modify the code and test locally

* install development dependencies `npm install`
* install nodemon globally `npm install --global nodemon` (makes changing the code easier)
* install gulp-cli globally `npm install --global gulp-cli` (for documentation & deploy scripts)
* update the `.env` file with `NODE_ENV=development` to turn on pretty logging and pull in the `development.json` config file
* update the `development.json` config file with the settings that you want
* update the `.env` file with your remote host if doing a sync to a cloud instance
* start the server with `nodemon src/start_local` and hack away. Server will restart with every code save
* tun the test suite with `npm test` to verify everything is working on your environment
* create new tests in the `__test__` folder for your new components (there are examples for synchronous, asynchronous and API response tests)
* update the `jest` section of `package.json` to specify which tests to run and how to view the results

### to modify the code to run in AWS Lambda

This is currently not working, so these are the right instructions but the repository won't run
properly until a few bugs are ironed out. Probably August 2019 for that update.

* install serverless framework globally `npm install --global serverless`
* [possibly make](https://serverless.com/framework/docs/providers/aws/guide/credentials/#aws---credentials)
  and configure [aws credentials](https://serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/)
* update [serverless.yml](https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/)
* Execution
  * local: configure `/.vscode/runtime.env` to set `NODE_ENV`
  * lambda: edit `serverless.yml` to set `NODE_ENV` for the cloudformation deployed app

## AWS requirements

All AWS credentials are taken from environment variables - it's up to you to make them right before
executing the demo server if you're going to use the AWS facilities of the demo.

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY

Region information is stored in the config files. The following permissions are needed if you're going
to replicate the s3 bucket storage and replicated the SimpleDB back end:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucketByTags",
                "s3:GetBucketTagging",
                "s3:GetObjectVersionTagging",
                "s3:ListBucketVersions",
                "s3:GetBucketLogging",
                "s3:ListBucket",
                "s3:GetObjectTagging",
                "s3:ListBucketMultipartUploads",
                "s3:GetBucketWebsite",
                "s3:GetBucketNotification",
                "s3:GetObjectVersionForReplication",
                "s3:GetBucketLocation",
                "s3:GetObjectVersion",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "s3:HeadBucket"
            ],
            "Resource": [
                "arn:aws:s3:::*/*",
                "arn:aws:s3:::imf-mm-api-media"
            ]
        },
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sdb:ListDomains",
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "sdb:*",
            "Resource": "arn:aws:sdb:eu-east-2:*:domain/myDomainName"
        }
    ]
}
```
