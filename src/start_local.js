/* jshint node: true */
'use strict'
/** This app requires a few environment variables to work properly
 *  these environment variables control which config is loaded
 *  and the access keys for the AWS function.
 * 
 * The environment should be stored in a file called .env
 * The environment file MUST NOT be checked into your repository
 */
let env_check_failed = (undefined == process.env.NODE_ENV) || (undefined == process.env.AWS_ACCESS_KEY_ID) || (undefined == process.env.AWS_SECRET_ACCESS_KEY)

//try pulling in a.env file to see if it fulfils requirements
if (env_check_failed) {
    require('dotenv').config()
    env_check_failed = (undefined == process.env.NODE_ENV) || (undefined == process.env.AWS_ACCESS_KEY_ID) || (undefined == process.env.AWS_SECRET_ACCESS_KEY)
    //If we still don't have everything then abort
    if (env_check_failed) {
        let msg = `ERROR: Environment variables not set aborting - see README.md (config: ${process.env.NODE_ENV})`
        console.log(msg)
        throw new Error(msg)
    }
    console.log(`Environment set from .env file (config: ${process.env.NODE_ENV})`)
} else {
    console.log(`Environment set from parent process (config: ${process.env.NODE_ENV})`)
}

/* config management load order described here: https://github.com/lorenwest/node-config/wiki/Configuration-Files
 * NODE_ENV legal values: development, staging, beta, production
 * see README.md for how to set this.
 * 
 * default.json has all the default settings for this application
 * default.yaml has all the data from the API definition
 * 
 * Note that the config variable names have been chosed to avoid a clash with
 * the OpenAPI core parameters. Pay attention to this if you update this implementation
 * 
 */
const config = require('config')
const open = require('open')
const pino = require('pino')
//log to stderr
const log = pino(config.get('log_options'), pino.destination(2))
const u = require('./lib/util')
//define a right Justification helper function to make logs more readable
const rJ = u.left_pad_for_logging
let listen_on_port = config.get('port')
if (process.env.PORT_OVERRIDE) {
    listen_on_port = process.env.PORT_OVERRIDE
    console.log(`port: ${listen_on_port}`)
}

log.info(rJ('Using config') + config.get('annotation'))

// log all the config files used if needed
if (config.get("log_options").show_config_sources) {
    let sources = config.util.getConfigSources()
    let n = 0
    sources.forEach((source) => {
        log.info(rJ('source #', 14) + `${n++} from ${source.name}`)
    })
}

//load the server library which loads all the api funcitons
const server = require('./imf-mm-api-server')

//the server initialises asynchronously (aws database may take a while)
server.mm_init()
    .catch((e) => {
        //server failed to initialise - abort with a log
        log.info(rJ('Server init failed:') + `port was ${listen_on_port}`)
    })
    .then(() => {
        //We should be ready to go now, so start the server on the required port
        log.info(rJ('Listening on port:') + `${listen_on_port}`)
        log.info(rJ('Listening for api:') + `/${config.get('api_prefix')}/*`)
        server.mm_http_instance = server.listen({ "port": listen_on_port, })
    })

//if we have enabled serving of web pages then ask the OS to go to the home page
if (config.get('enable.www')) {
    open(`http://localhost:${listen_on_port}`)
}

// The exports lines is only for the Jest test harness
// It is not needed in development or production
module.exports.server = server

// --------------------------------------------------------------------------------

/* @ToDo:
 *  Add config log access to aws Simple dB
 *  Create gulp task to generate documentation
 *    - documentation on methods
 *       - /scan
 *       - /docs
 *       - /crawl
 *  Create gulp task to upload via sftp to a server
 *  Update website documentation for reference.imf-mm-api.cloud
 */