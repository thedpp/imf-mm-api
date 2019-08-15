/* jshint node: true */
'use strict'
/** @module api-admin-fs
 * 
 * Crawl a few adming functions for the demo software
 */

const config = require('config')
const process = require('process')
const path = require('path')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = path.basename(__filename)

const Router = require('koa-router');
const fs = require('fs')

//Prefix all routes for this API with /crawl
const router = Router({ prefix: `/admin`, })


/** return information about the system
 * @returns {JSON} 
 */
const get_system_info = async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')

  let status = {
    app_name: config.get('app_name'),
    app_version: config.get('app_version'),
    app_authors: config.get('app_authors'),
    api_prefix: config.get('api_prefix'),
    provider_id: config.get('provider_id'),
    db_type: config.get('database.type'),
    log_level: config.get('log_options.level'),
    node_env: process.env.NODE_ENV,
  }

  // log all the config files used if needed
  if (config.get("log_options").show_config_sources) {
    let sources = config.util.getConfigSources()
    status.config= []
    let n = 0
    sources.forEach((source) => {
      status.config.push(`${n++} from ${source.name}`)
    })
  }

  //prettify the JSON with an indent of 2
  ctx.body = JSON.stringify(status, undefined, 2)

  await next()
}

/** return information about the databse
 * @returns {JSON} 
 */
const get_database_info = async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')

  let db = require('./db')
  let status = await db.info()

  //prettify the JSON with an indent of 2
  ctx.body = JSON.stringify(status, undefined, 2)

  await next()
}

const reset_db = async (ctx, next) => {
  ctx.status = 201
  ctx.set('Content-Type', 'application/json')

  let db = require('./db')
  let posted = await db.reset()
    .catch(e => {
      log.error(`${rJ(_module)}: reset db: ${e.message} from ${e.fileName}(${e.lineNumber})`)
      ctx.body = JSON.stringify(
        {
          db_type: db.type,
          db_status: e.message,
        }
      )
    })
    .then(x => {
      ctx.body = JSON.stringify({
        db_type: db.type,
        db_status: 'reset',
      })
    })
  await next()
};

router.get(`/info`, get_system_info)
router.get(`/db-info`, get_database_info)
router.delete(`/db`, reset_db)

log.info(`${rJ('module:')} api-admin initialised`)

module.exports = router;