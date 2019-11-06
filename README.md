# imf-mm-api

A node server to implement the IMF Media Management API with a choice of databases

The default behaviour is to provide a simple app that will scan one or more folders for IMF
assets, build a database of those assets and then serve the locations of those assets based
on the IDs or hash values found. New assets can be registered using the API.

The app is controlled via your system's default browser and has been tested with Chrome, Chromium
Firefox and Edge on Windows & Linux. The cloud deployment is available at [imf-mm-api.cloud](https://imf-mm-api.cloud).

You can modify the behaviour by changing the config (see below). This will allow you to disable certain
funcitons or to mount the application on a server somethwere other than the root of the domain.

This app is meant to demonstrate the API functionality. The backend is not intended for production.
Contact [Mr MXF](https://mrmxf.com) if you need something more robust.

## installation

### to just run the code

* install node 8.10 or above
* clone (or download and unzip) the repository into a folder
* `cd` into that folder
* install dependencies `npm install --production`
* fix any security issues `npm audit fix`
* dedupe modules `npm dedupe`
* create a `.env` file with how you want to run the code and credentials for AWS  if you
  are going to use AWS SimpleDB as your database

```bash
# run time environment variables for imf-mm-api (you can safely copy this to a .env file)
#
# what mode are we in? Uncomment one of these
#NODE_ENV=test
NODE_ENV=development
#NODE_ENV=staging
#NODE_ENV=beta
#NODE_ENV=production
export NODE_ENV
#
# Override any configuration property via environement JSON e.g. port or disable DB delete
NODE_CONFIG='{"port":3100,"log_options":{"level":"error","log_api_access":false},"enable":{"admin_delete_db":false}}'
export NODE_CONFIG
#
# AWS keys to access SimpleDB if you use your own cloud AWS SimpleDB database
AWS_ACCESS_KEY_ID=XxXxXxXxXxXxXxXxXxXx
AWS_SECRET_ACCESS_KEY=ZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
#
# GIT url for this version for display in browser
GIT_URL=https://github.com/mrmxf/imf-mm-api/tree/1348034577d532bd0ea4a8b267a2a8b54feb5264
export GIT_URL
```

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

### to build and run Docker image

The project can be used as Docker container.

First build the image:
`docker build -t imf-mm-api .`

First build the image:
`docker run -d -p 3100:3100 --name imf-mm imf-mm-api`

Then simply access to the API:
[http://localhost:3100/demo/1/assets](http://localhost:3100/demo/1/assets)

## AWS requirements

To use the simpledb cloud database as the backend, you will need to provide AWS keys that allow the
creation of a simpledb domain and access to Simpledb records.

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

## config

`default.json` has the master list of all the configuration options. These properties are
overloaded by `NODE_ENV` that controls the functiona mode of the app. For example, you might
make some changes and run the software with `NODE_ENV` set to `staging` so that you can test
the changes along side your main server.

### config options

* `port  {number}` controls the port that the server will respond to
* `app_name  {string]` used when `GET admin/info` is requested
* `app_version  {string]` used when `GET admin/info` is requested
* `app_authors  {string]` used when `GET admin/info` is requested
* `api_prefix  {string]` controls the url prefix for API response e.g. `GET staging/assets`
* `database  {object}`
  * `database.type  {string}` is either `local` or `aws-simple-db` other values require updating `src/db.js`
  * `database.local_filename  {string}` relative filename for database when type is `local` e.g. `db/imf-mm-api-lowdb.json`
  * `database.simpledb_domain_name  {string}` domain name used for aws simpledb e.g. `imf-mm-api-server-js`
* `default_get_limit  {number}` paging control for `GET` responses. API default is `20`
* `enable  {object}` controls which functions are enabled or disabled
  * `enable.admin  {boolean}`": global switch for the `/admin` route
    * `GET admin/info` information about the running app
    * `GET admin/db-info` information about the database in use
    * `GET admin/readme` the current (unprocessed) README.md for the app
    * `DELETE admin/db`  delete and recreate the current database
  * `enable.admin_delete_db  {boolean}` additional control to prevent database deletion when `enable.admin` is true
  * `enable.assets   {boolean}` enable the assets API
  * `enable.crawl    {boolean}` enable population of the database by crawling folders specified in the config files
  * `enable.www   {boolean}`  enable serving static pages for interactive use
  * `enable.load_home_page_on_boot   {boolean}` when the app is run, use the OS to open a browser (turn off in the cloud!)
  * `enable.extended_status_messages  {boolean}` append the description text from the assets API swagger document to error responses
  * `enable.synth_local_test_data  {boolean}`  recreate run time information for the local IMF test assets
     (only needed if you make changes to the `__test__/assets-xxx` folders. Set to `false` if program folder is write protected)
* `mount_point` set the url to which all the end points are mounted - very handy with cloudfront
  * e.g. `/` to respond to **GET /assets**
  * e.g. `/my_cloudfront_host/web_root` to respond to **GET /my_cloudfront_host/web_root/assets**
* `imf_asset_sources  {array}` determines where the crawl function will search for IMF assets. If the array
  element is a string then it is treated as a file root and search is performed hierarchically below that folder.
  If the array element is an object, then is is treated as an s3 bucket object and the appropriate access
  permissions should be available via the environment keys
  * e.g.  `[ "__test__/assets-imf" ]` default value to search the test assets supplied with this app
  * e.g.  `[ "\\\\unc_mount\\win\\doze\\folder", "/mnt/nfs/nix/folder" ]` scanning network folders
  * e.g.  `[{"arn": "arn:aws:s3:::imf-mm-api-media","bucket": "imf-mm-api-media","root": "media/bs500","region": "us-east-2"}]`
    * `object.arn  {string}`  the arn of the bucket to be crawled
    * `object.bucket  {string}`  the name of the bucket
    * `object.root  {string}`  the path below which the crawler should crawl for IMF assets
    * `object.region  {string`  the region in which the bucet is located
* `lambda  {object}` The lambda functionality is currently not working - **BO NOT USE**
  * `lambda.params.name  {string}` name of the lambda function implementing these end points e.g. "imf-api-staging-test",
  * `lambda.params.role  {string` role with access rights e.g. "arn:aws:iam::217890066136:role/service-role/mm-lambda-api-gateway-role"
  * `lambda.options.region  {string}` deployed region of the lambda function e.g. "eu-east-2"
  * `lambda.options.profile" e.g. "default"
* `log_options  {object}` controls the logging of the server. Logs are created in JSON format by [pino](https://github.com/pinojs).
  There are many adapters and converters to make the logs usable in elasticsearch, excel or whatever religion is your favourite.
  * `log_options.level  {string}` minimum level of logs to be output. Values are: fatal, error, warn, info, debug, trace, silent
  * `log_options.prettyPrint  {boolean}` makes the console output of the logs pretty. This slows the world down.
  * `log_options.show_config_sources  {boolean}` dumps the configuration sources in the order they were loaded. A security risk in a live system
  * `log_options.log_api_access  {boolean}` loads the logger into the server stack to log all access to the server.
* `provider_id  {string}` The provider id that will be insered into the database when this app uses the POST or PUT methods
    e.g. "imf-mm-api Demo App",

## API Change Log

* 2019-10-14 Docker image
  * provide the Docker image of the service
* 2019-09-03 deployment updates
  * fixed mounting of the app under defferent routes by providing `config.mount_point`
  * updated cloud instance for testing with `staging`, `beta` and `1/` end points
  * improved documentation
* 2019-08-23 v0.4 of the API
  * Added 415 response when POST body cannot be parsed by server
  * Documented ETag behaviour in GET /asset/{id}
  * Changed locationProviderId to an array of strings and added documentation on aggregation
* 2019-06-10 v0.3 of the API and its initial publication
