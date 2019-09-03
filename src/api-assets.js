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
  // asynchronously fetch a page from the database
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

  // asynchronously fetch the matching assets
  let assets = await db.get_assets_by_id(skip, limit, ctx.params.id)
    .catch((err) => {
      log.error(err.message)
    })

  ctx.set('Content-Type', 'application/json')

  if (assets) {
    //we have at least one record
    //format the results according to the API spec
    let api_response = dbtk.asset_TO_api_get_results(assets)
    api_response.skip = skip
    api_response.limit = limit
    api_response.total = await db.total()
    //return the result as an array for consistency
    ctx.body = JSON.stringify(api_response)

    if (api_response.results.length < 1) {
      ctx.status = 404
      ctx.body = `Asset ID not found ${ctx.params.id}`
    } else if (api_response.results.length == 1) {
      ctx.status = 200
    } else {
      //there are multiple results
      ctx.status = 300
    }
  } else {
    ctx.status = 404
    ctx.body = `Asset ID not found ${ctx.params.id}`
  }

  await next()
}

/** set the response for POST and PUT messages
 * 
 * @param {Koa_contect} ctx  the Koa Context objext
 * @return {boolean} true if the error message was succesfully created
 */
const status_response = (status, ctx, message) => {
  ctx.status = status
  ctx.set('Content-Type', 'text/plain')
  try {
    let status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
    let description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
    if (config.get('enable.extended_config_messages')) {
      let msg = (undefined == message) ? '' : message
      ctx.body = `${status_label}\n\nExtended Message:\n${description}\n----------\n${msg}`
    } else {
      ctx.body = status_label
    }
    return true
  } catch (e) {
    return false
  }
}

const add_new_asset = async function (ctx, next) {
  let asset = ctx.request.body

  if (!validate_asset.request_headers(ctx)) {
    //reject bad headers with 415
    status_response(415, ctx, "Bad Headers detected")
  } else {
    let good_json = validate_asset.json_values(asset)
    if (good_json.status < 300) {
      let ret = await db.post(asset)
      if (ret == 'ok') {
        status_response(good_json.status, ctx)

        //Set the location header according to the API spec
        ctx.set('Location', `${ctx.request.href}${asset.identifiers[0]}`)
      } else {
        //bad json
        status_response(415, ctx, "Payload seemed valid, but database rejected asset")
      }
    } else {
      //could not validate payload so reject with (probably) 415
      status_response(good_json.status, ctx, "Could not validate POST payload")
    }
  }

  await next()
}

const delete_asset = async (ctx, next) => {
  // asynchronously fetch the matching assets
  let response = await db.delete_assets_by_id(ctx.params.id)

  ctx.set('Content-Type', 'application/json')

  if (response) {

    if ('number' == typeof response) {
      ctx.status = response
      switch (response) {
        case 204:
          ctx.body = `No Content. Asset Removed.`
          break
        case 404:
          ctx.body = `Not Found`
          break
        default:
          ctx.body = `Hmmm`
      }
    } else {
      /**  @todo there are multiple results */
      ctx.status = response
      ctx.body = undefined
    }
  } else {
    ctx.status = 404
    ctx.body = `Asset ID not found ${ctx.params.id}`
  }

  await next()
}

router.get(`/${config.get('api_prefix')}/assets`, get_assets)
router.get(`/${config.get('api_prefix')}/assets/:id`, get_assets_by_id)
router.put(`/${config.get('api_prefix')}/assets/:id`, not_implemented)
router.post(`/${config.get('api_prefix')}/assets/`, add_new_asset)
router.delete(`/${config.get('api_prefix')}/assets/:id`, delete_asset)

log.info(`${rJ('module: ')}api-assets initialised at /${config.get('api_prefix')}/assets`)

module.exports = router;