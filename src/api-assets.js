/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

const Router = require('koa-router')
const router = Router()

const validate_asset = require('./lib/lib-validate-asset-api-record')
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
  api_response.skip = skip
  api_response.limit = limit
  api_response.total = await db.total()

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
  let api_response = dbtk.asset_TO_api_get_results(assets)
  api_response.skip = skip
  api_response.limit = limit
  api_response.total = await db.total()

  let match
  for (var i = 0; i < api_response.results.length; i++) {
    for (var j = 0; j < api_response.results[i].identifiers.length; j++)
      if (ctx.params.id == api_response.results[i].identifiers[j]) {
        match = i
      }
  }

  ctx.set('Content-Type', 'application/json')

  if (match) {
    ctx.status = 200
    ctx.body = JSON.stringify([api_response.results[match],])
  } else {
    ctx.status = 404
    ctx.body = `Asset ID not found ${ctx.params.id}`
  }

  await next()
}

const add_new_asset = async function (ctx, next) {
  let asset = ctx.request.body

  if (!validate_asset.request_headers(ctx)) {
    ctx.status = 415
    let status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
    let description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
    ctx.body = `${status_label} ${description}`
  } else {
    let good_json= validate_asset.json_values(asset)
    if (good_json.statu<200) {
      let ret = await db.post(asset)
      if (ret = 'ok') {
        ctx.status = 415
        let status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
        let description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
        ctx.body = status_label

        //Set the location header according to the API spec
        ctx.set('Location', `${ctx.request.href}${asset.identifiers[0]}`)
      } else {
        ctx.status = 415
        let status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
        let description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
        ctx.body = `${status_label} ${description}`
      }
    } else {
      //could not validate payload so reject with 415
      ctx.status = good_json.status
      let status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
      let description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
      ctx.body = `${status_label} ${good_json.help}\n${description}`
    }
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

router.post(`/${config.get('api_prefix')}/assets/`, add_new_asset)

router.delete(`/${config.get('api_prefix')}/assets:id`, not_implemented)

log.info(`${rJ('module: ')}api-assets initialised`)

module.exports = router;