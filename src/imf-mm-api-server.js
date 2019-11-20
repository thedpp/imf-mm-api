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
const bodyParser = require('koa-bodyparser');
const mount = require('koa-mount')

const db = require('./db')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

let server = new Koa();

//log access if required
if (config.get('log_options').log_api_access) {
    server.use(pino)
}

//load the body parser
server.use(bodyParser())

if (config.get('enable.www')) {
    let www = require('koa-static')
    server.use(mount(config.get('mount_point'), www('docs/www/', {})))
}
if (config.get('enable.admin')) {
    let api = require('./api-admin.js')
    server.use(mount(config.get('mount_point'), api.routes()))
}
if (config.get('enable.assets')) {
    let api = require('./api-assets.js')
    server.use(mount(config.get('mount_point'), api.routes()))
}
if (config.get('enable.crawl')) {
    let api = require('./api-crawl-fs.js')
    server.use(mount(config.get('mount_point'), api.routes()))
}

server.mm_init = async (resolve) => {
    db.init()
}

module.exports = server