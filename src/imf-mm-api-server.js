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

            //log access if required
            if (config.get('log_options').log_api_access) {
                server.use(pino)
            }

            //load all the server modules depending on what was configured
            if (config.get('enable.www')) {
                let www = require('koa-static')
                server.use(www('docs/www/', {}))
            }
            if (config.get('enable.admin')) {
                let api = require('./api-admin.js')
                server.use(api.routes())
            }
            if (config.get('enable.assets')) {
                let api = require('./api-assets.js')
                server.use(api.routes())
            }
            if (config.get('enable.crawl')) {
                let api = require('./api-crawl-fs.js')
                server.use(api.routes())
            }
            if (config.get('enable.scan')) {
                let api = require('./api-scan-s3.js')
                server.use(api.routes())
            }
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