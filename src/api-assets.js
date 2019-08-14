/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging

const Router = require('koa-router')
const router = Router()

//get our database
const db = require('./db')
const dbtk = require('./lib/lib-db-toolkit')

const not_implemented = async function (ctx, next) {
  ctx.status = 501
  ctx.set('Content-Type', 'text/plain')
  ctx.body = `imf-mm-api functionality not Implemented yet. Come back later.`
  // don't fire the next event. We're done
  await next()
}

const get_assets = async function (ctx, next) {
  let skip = parseInt((ctx.request.query.skip) ? ctx.request.query.skip : 0, 10)
  let limit = parseInt((ctx.request.query.limit) ? ctx.request.query.limit : config.get('default_get_limit'), 10)
  // asynchronously fetch the first page from the database
  let assets = await db.get(skip, limit)

  //format the results according to the API spec
  let api_response = dbtk.asset_TO_api_get_results(assets)

  //massage the response
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')
  ctx.body = JSON.stringify(api_response)

  //pass response to the next middleware
  await next()
}

const get_assets_by_id = async function (ctx, next) {
  let skip = parseInt((ctx.request.query.skip) ? ctx.request.query.skip : 0, 10)
  let limit = parseInt((ctx.request.query.limit) ? ctx.request.query.limit : config.get('default_get_limit'), 10)
  // asynchronously fetch the first page from the database
  let assets = await db.get(skip, limit)

  //format the results according to the API spec
  let all_assets = dbtk.asset_TO_api_get_results(assets)

  let match
  for (var i = 0; i < all_assets.results.length; i++) {
    for (var j = 0; j < all_assets.results[i].identifiers.length; j++)
      if (ctx.params.id == all_assets.results[i].identifiers[j]) {
        match = i
      }
  }

  ctx.set('Content-Type', 'application/json')

  if (match) {
    ctx.status = 200
    ctx.body = JSON.stringify([all_assets.results[match],])
  } else {
    ctx.status = 404
    ctx.body = `Asset ID not found ${ctx.params.id}`
  }

  await next()
}

/* this instance of the app is configured to route one of:
 *    /staging/xxx
 *    /beta/xxx
 *    /1/xxx
 * 
 * config.get('api_prefix') controls which of these
 */

// router.get('/assets', get_assets)
// router.get('/assets/:id', get_assets_by_id)
// router.put('/assets/:id', not_implemented)
// router.post('/assets/:id', not_implemented)
// router.delete('/assets/:id', not_implemented)

router.get(`/${config.get('api_prefix')}/assets`, get_assets)
router.get(`/${config.get('api_prefix')}/assets/:id`, get_assets_by_id)

router.put(`/${config.get('api_prefix')}/assets/:id`, not_implemented)

router.post(`/${config.get('api_prefix')}/assets/:id`, not_implemented)

router.delete(`/${config.get('api_prefix')}/assets:id`, not_implemented)

log.info(`${rJ('module:')} api-assets initialised`)

module.exports = router;