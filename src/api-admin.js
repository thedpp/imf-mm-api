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
const _module = require('path').basename(__filename)

const Router = require('koa-router');
const fs = require('fs')

//Prefix all routes for this API with /admin
const router = Router({ prefix: `/admin`, })

/** return information about the system
 *
 * @typedef {Object} Admin_info_response
 * @property {String} app_name the name of the app from the config
 * @property {String} app_version the version of the app from the config
 * @property {Array} app_authors the authors of the app from the config
 * @property {String} api_prefix the prefix used for the Assets API from the config
 * @property {String} provider_id the provider_id for assets registered by the running app from the config
 * @property {String} db_type the database type of the running app from the config
 * @property {String} log_level logging level from the config
 * @property {String} node_env the environment variable NODE_ENV used in the running app

 * @returns {Admin_info_response} 
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
    git_url: ((process.env.GIT_URL) ? process.env.GIT_URL : false)
  }

  // log all the config files used if needed
  if (config.get("log_options").show_config_sources) {
    let sources = config.util.getConfigSources()
    status.config = []
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
 * 
 * @typedef {Object} Database_info_response
 * @property {String} app_name the name of the app from the config
 * 
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

/** return the current README file
 * 
 * @returns {String} the readme.md file from the root folder
 */
const get_readme = async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')

  ctx.body = fs.readFileSync('README.md')
  await next()
}

const reset_db = async (ctx, next) => {
  ctx.set('Content-Type', 'application/json')

  if (config.get('enable.admin_delete_db')) {
    let db = require('./db')
    let posted = await db.reset()
      .catch(e => {
        log.error(`${rJ(_module + ': ')}reset db: ${e.message} from ${e.fileName}(${e.lineNumber})`)
        ctx.status = 500
        ctx.body = JSON.stringify(
          {
            db_type: db.type,
            db_status: e.message,
          }
        )
      })
      .then(async (res) => {
        ctx.status = 204
        let info = await db.info()

        //prettify the JSON with an indent of 2
        ctx.body = JSON.stringify(info, undefined, 2)
        await next()
      })
  } else {
    //deleting the dB has been disable
    ctx.status = 405
    ctx.body = 'Deletion of the database has been disabled. Please contact the administrator.'
  }
};

router.get(`/info`, get_system_info)
router.get(`/db-info`, get_database_info)
router.delete(`/db`, reset_db)
router.get(`/readme`, get_readme)

log.info(`${rJ('module: ')}api-admin initialised`)

module.exports = router