/* jshint node: true */
'use strict'

/** @module registration API handler */

/**
 * @todo - tidy up all the help responses. The PUT method made it messy.
 * @todo - add authentication headers and validation
 */

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
/** return the error description from config default.yaml
 * @param {string} mode - GET, PUT, POST, DELETE
 * @param {integer} status - the status code for the mode
 * 
 * return the code from the config default.yaml and optionally append
 * the extended_description if config.enable.extended_config_messages
 * is set
 */
function status_description(mode, status, extended_description) {
  try {
    let msg = config.get(`paths./assets.${mode}.responses.${status}.description`)
    if (config.get(`enable.extended_config_messages`)) {
      return msg + extended_description
    } else {
      return msg
    }
  } catch (e) {
    return `Undocumented Status ${status}`
  }
}

const get_assets = async function (ctx, next) {
  let skip = parseInt((ctx.request.query.skip) ? ctx.request.query.skip : 0, 10)
  let limit = parseInt((ctx.request.query.limit) ? ctx.request.query.limit : config.get('default_get_limit'), 10)

  // asynchronously fetch a page from the database
  let assets = await db.get_assets(skip, limit, ctx.request.query['[file-type]'])

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

/** GET an asset by an ID
 * @param {koaCtxType} ctx - the koa context
 * @param {async function} next - the next handler in the chain
 * @returns {Promise}
 */
const get_assets_by_id = async function (ctx, next) {
  let skip = parseInt((ctx.request.query.skip) ? ctx.request.query.skip : 0, 10)
  let limit = parseInt((ctx.request.query.limit) ? ctx.request.query.limit : config.get('default_get_limit'), 10)

  let research_asset_id = ctx.params.id
  // asynchronously fetch the matching assets
  let assets = await db.get_assets_by_id(skip, limit, research_asset_id)
    .catch((err) => {
      log.error(err.message)
    })

  ctx.set('Content-Type', 'application/json')

  if (assets) {
    //we have at least one record
    //format the results according to the API spec
    let api_response = dbtk.asset_TO_api_get_results(assets)
    //return the entity tag for collision avoidance
    let etag = dbtk.asset_etag(assets)
    ctx.set('ETag', etag)

    api_response.skip = skip
    api_response.limit = limit
    api_response.total = await db.total()
    //return the result as an array for consistency
    ctx.body = JSON.stringify(api_response)

    if (api_response.results.length < 1) {
      ctx.status = 404
      ctx.set('Content-Type', 'text/plain')
      ctx.body = `Asset ID not found ${research_asset_id}`
    } else if (api_response.results.length == 1) {
      ctx.status = 200
    } else {
      //there are multiple results
      ctx.status = 300
    }
  } else {
    ctx.status = 404
    ctx.set('Content-Type', 'text/plain')
    ctx.body = `Asset ID not found ${research_asset_id}`
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
    //grab thelabel and description from the config default.yaml files
    let status_label = ''
    let description = ''
    if (`post` == ctx.method.toLowerCase()) {
      status_label = config.get(`paths./assets.post.responses.${ctx.status}.content.application/json.example.status_label`)
      description = config.get(`paths./assets.post.responses.${ctx.status}.description`)
    } else {
      //status_label = config.paths['/assets/{id}'].put.responses.put.content.['application/json'].example.status_label
      description = config.paths['/assets/{id}'].put.responses.put.description
    }
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

/** PUT an asset update by an ID
 * @param {koaCtxType} ctx - the koa context
 * @param {async function} next - the next handler in the chain
 * @returns {Promise}
 */
const put_assets_update = async function (ctx, next) {
  let skip = parseInt((ctx.request.query.skip) ? ctx.request.query.skip : 0, 10)
  let limit = parseInt((ctx.request.query.limit) ? ctx.request.query.limit : config.get('default_get_limit'), 10)

  let research_asset_id = ctx.params.id
  // asynchronously fetch the matching assets
  let assets = await db.get_assets_by_id(skip, limit, research_asset_id)
    .catch((err) => {
      log.error(err.message)
    })

  ctx.set('Content-Type', 'application/json')

  // no matching asset to update
  if (!assets) {
    ctx.status = 404
    ctx.set('Content-Type', 'text/plain')
    ctx.body = `Asset ID not found ${research_asset_id}`
    await next()
    return
  }

  if (assets.length > 1) {
    //reject bad headers with 415
    status_response(300, ctx, "Cannot update when there is more than one matching id.")
    await next()
    return
  }

  //we have only  one record
  //format the results according to the API spec
  let api_response = dbtk.asset_TO_api_get_results(assets)
  //find the database entity tag for collision avoidance
  let etag_db = dbtk.asset_etag(assets)

  //get the request entitiy tag to be sure they match
  let etag_req = ctx.headers["if-match"]

  if (!etag_req) {
    // there was no If-Match header so we should error 428
    status_response(428, ctx, "Precondition required. Expecting If-Match header")
  } else if (etag_req !== etag_db) {
    // there was an If-Match header but db has changed since the client
    // did the last GET request for this ID to error 412
    status_response(412, ctx, "Precondition failed. etag did not match for update")
  } else {
    // etag matches so we can try to update the record from the supplied data

    if (!validate_asset.request_headers(ctx)) {
      //reject bad headers with 415
      status_response(415, ctx, "Bad Headers detected")
    } else {
      let asset = ctx.request.body
      //let good_json = validate_asset.json_values(asset)
      let good_json = {
        status: 204,
        help: "Asset registration updated",
      }
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
  }
  await next()
}

const post_new_asset = async function (ctx, next) {
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
router.put(`/${config.get('api_prefix')}/assets/:id`, put_assets_update)
router.post(`/${config.get('api_prefix')}/assets/`, post_new_asset)
router.delete(`/${config.get('api_prefix')}/assets/:id`, delete_asset)

log.debug(`${rJ('module: ')}api-assets initialised at /${config.get('api_prefix')}/assets`)

module.exports = router;
