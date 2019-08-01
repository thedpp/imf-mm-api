/* jshint node: true */
'use strict'
/** 
 *  @module  imf-mm-api-server
 *  @author 
 */
const Koa = require('koa');
const pino = require('koa-pino-logger')({ prettyPrint: true, })
const config = require('config')
const process = require('process')

const db = require('./db')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
let server = new Koa();

server.mm_init = async function (option) {
    return db.init()
        .then(() => {
            //load the utility functions
            var u = require('./lib/util')

            //load all the api modules
            var api_assets = require('./api-assets.js')
            var api_crawl_fs = require('./api-crawl-fs.js')
            var api_scan_s3 = require('./api-scan-s3.js')

            //log access if required
            if (config.get('log_options').log_api_access) {
                server.use(pino)
            }

            server.use(api_assets.routes())
            server.use(api_crawl_fs.routes())
            server.use(api_scan_s3.routes())
        })
        .catch((e) => {
            log.error(`${rJ('server did not init')}: ${e}`)
            log.error(`${rJ('NODE_ENV mode')}: ${process.env.NODE_ENV}`)
            log.error(`${rJ('using db')}: ${config.get('database.type')}`)
            log.error(`${rJ('will use  port')}: ${config.get('port')}`)
            process.exit(1)
        })
}

module.exports = server