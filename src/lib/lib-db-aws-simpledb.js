/** @module AWS Simple database
 * 
 * it's dumb, it's not intended for production but it works
 * it might be slow and limited in the length of identifiers but hey, it's not for production.
 * 
 * AWS credentials are taken from Environment letiables - see readme
 */
/* jshint node: true */
'use strict'
const simpledb = require('simpledb')
const AWS = require("aws-sdk")
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

/** The simpledb library provides all the nice back-off functionality
 *  but needs to be given credentials manually. Let's extract them using
 *  the AWS automatic mechanisms from the environment letiables
*/
let aws_auto_config = new AWS.Config();

/**the structure of the configuration parameters for init() and reset()
 *
 * @typedef {Object} Simpledb_override_parameters
 * @property {String} simpledb_domain_name a domain name string of the database
 * 
 */

/* The preferred way to provide credentials is via the environment letiables
 * If they are missing then don't initialise sdb and therefore nothing will
 * ever run. An error will be thrown when init is called
 */
let sdb
if (aws_auto_config.credentials) {
  const sdb_instance = new simpledb.SimpleDB({
    keyid: aws_auto_config.credentials.accessKeyId,
    secret: aws_auto_config.credentials.secretAccessKey,
  }) //, simpledb.debuglogger)
  sdb = sdb_instance
  log.info(`${rJ('aws sdb connect: ')}success`)
}

/**
 * 
 * @param {Simpledb_override_parameters} params 
 */
const _resolve_sdb_domain = (params) => {
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain = (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain
  return sdb_domain
}

/** promisify the select query to make the code easier to read
 * 
 */
const _select = async (query, override) => {
  return new Promise((resolve, reject) => {
    if (!sdb) {
      reject(new Error(`${rJ('aws sdb did not init: ')}select query failed`))
    }
    sdb.select(query, override, function (err, result, meta) {
      if (err) {
        reject(err)
      }
      resolve({ result: result, meta: meta, })
    })
  })
}

/** promisify a getNextToken query to make the code easier to read
 * 
 */
const _getNextToken = async (skip, params) => {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise(async (resolve, reject) => {
    if (!sdb) {
      reject(new Error(`${rJ('aws sdb did not init: ')}select query failed`))
    }
    if (skip == 0) {
      //skip is zero so return undefined
      resolve(undefined)
    }
    //do a dummy pointer reset of the database
    let sdb_res = await _select(`select count(*) from \`${sdb_domain}\` limit ${skip}`)
      .catch((err) => {
        reject(err)
      })
    if (sdb_res && sdb_res.meta && sdb_res.meta.result && sdb_res.meta.result.SelectResult && sdb_res.meta.result.SelectResult.NextToken) {
      resolve(sdb_res.meta.result.SelectResult.NextToken)
    }
    // we have run off the end of the data - return exactly false
    resolve(false)
  })
}

//remember if we have initialised the library or not (to make external code easy)
//initialised= false, pending, complete or failed
let initialised = false

const handle_initialisation = function () {
  switch (initialised) {
    case 'complete':
      return
    case 'pending':
      //set timer for the state to change (ensure databse is created if needed)
      return
      break
    case false:
      return
    default:
    case 'failed':
      throw (`aws simple db (${config.get('database.simpledb_domain_name')}) failed to initialise`)
  }
}

/** Create a domain to store records
 * @param {String} [simpledb_domain_name = config('database.simpledb_domain_name')]
 */
const _create_domain = async function (simpledb_domain_name) {
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain = (simpledb_domain_name) ? simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    sdb.createDomain(sdb_domain, function (err, res, meta) {
      if (err) {
        initialised = 'failed'
        reject(err)
      } else {
        initialised = true
        resolve('ok')
      }
    })
  })
}

/** Delete a domain
 * @param {String} [simpledb_domain_name = config('database.simpledb_domain_name')]
 */
const _delete_domain = async function (simpledb_domain_name) {
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain = (simpledb_domain_name) ? simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    sdb.deleteDomain(sdb_domain, function (err, res, meta) {
      if (err) {
        //no change to initialised - state change is unknown
        reject(err)
      } else {
        initialised = false
        resolve('ok')
      }
    })
  })
}


/** Clone a restored asset for returning to caller
 * @param {Object} sdb_asset returned from SimpleDB
 * @returns {Object} a cleaned JSON object
 */
const _clean_sdb_asset = function (sdb_asset) {
  let asset = JSON.parse(JSON.stringify(sdb_asset))

  // need to un-JSON the attributes
  asset.aws = JSON.parse(sdb_asset.aws)
  asset.identifiers = JSON.parse(sdb_asset.identifiers)
  asset.locations = JSON.parse(sdb_asset.locations)
  asset.user = JSON.parse(sdb_asset.user)
  return asset
}

/** Clone an sdb asset for Storage
 * @param {Object} asset returned from SimpleDB
 * @returns {Object} a prepared JSON object
 */
const _prepare_sdb_asset = function (asset) {
  //perform a deep clone of our asset
  let sdb_asset = JSON.parse(JSON.stringify(asset))

  //stringify some of the elements so they get preserved in a SimpleDB attribute
  sdb_asset.aws = JSON.stringify(asset.aws)
  sdb_asset.identifiers = JSON.stringify(asset.identifiers)
  sdb_asset.locations = JSON.stringify(asset.locations)
  sdb_asset.user = JSON.stringify(asset.user)
  return sdb_asset
}

/** intialise the database
 * 
 * @param {Simpledb_override_parameters} [params]
 * @returns {String | Error} resolves to 'ok' or rejects with an error object
 */
const init = async function (params) {
  let sdb_domain = _resolve_sdb_domain(params)

  /* if the sdb object was not initialised then
   * 99% of the time it's becaue of not credentials
   * supplied
   */
  if (!sdb) {
    throw (new Error('SimpleDB could not initialise - were credentials set in the Environment?'))
  }
  initialised = 'pending'
  return _create_domain(sdb_domain)
}

/** reset and recreate the database
 * 
 * @param {Simpledb_override_parameters} params 
 * @returns {String | Error} resolves to 'ok' or rejects with an error object
 */
const reset = async function (params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise(async (resolve, reject) => {
    let deleted = await _delete_domain(sdb_domain)
    if (deleted) {
      resolve(_create_domain(sdb_domain))
    }
  })
}

/** return information about a domain (i.e. database name)
 * 
 * @typedef {Object} Simpledb_info_response
 * @property {String} thing is a thing
 * 
 * @param {Simpledb_override_parameters} params
 * @returns {Simpledb_info_response}
 */
const info = async function (params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise((resolve, reject) => {
    sdb.domainMetadata(sdb_domain, async function (err, res, meta) {
      if (err) {
        if (err.Code == "NoSuchDomain") {
          reject(`No such Database: ${sdb_domain}`)
        }
        reject(err)
      } else {
        resolve({
          db_type: 'aws simple db',
          db_name: sdb_domain,
          asset_count: res.ItemCount,
        })
      }
    })
  })
}

/** POST a new record or replace an existing one
 * 
 * @param {Sdb_asset} asset
 * @param {Simpledb_override_parameters} [params]
 * @returns {String | Error} resolves to 'ok' or rejects with an error object
 *
 * NOTE It is the responsibility of the database to generate the etag value
 * according to the anti-collision requirements of that database
 *
 * @todo improve return status to be an object with http code and message
 * @todo explore db post failure mechanisms
 */
const post = async function (asset, params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise((resolve, reject) => {
    /* @todo use one of the identifiers (hash?) as the canonical record */
    /* @todo search first to see if the identifier exists elsewhere */
    let item_name = asset.identifiers[0]

    asset.identifiers.forEach(element => {
      if (element.substr(0, 9) == "urn:sha1:") {
        item_name = element
      }
    });

    //simplest eTag for collision detection is a millisecond timestamp as a hex string
    asset.etag = new Date().getTime().toString(16)

    //prepare the asset for SimpleDB (JSON stringify objects)
    let sdb_asset = _prepare_sdb_asset(asset)

    sdb.putItem(sdb_domain, item_name, sdb_asset, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        resolve('ok')
      }
    })
  })
}

/** Get all records
 * @param {Integer} skip the number of entries to skip
 * @param {Integer} limit the maximum number of queries to return 
 * @param {Simpledb_override_parameters} [params]
 * @returns {Array | Error} resolves to array of asset objects or  rejects with an error object
 */
const get = async function (skip, limit, params) {
  let sdb_domain = _resolve_sdb_domain(params)

  skip = (undefined == skip) ? 0 : skip
  limit = (undefined == limit) ? config.get('default_get_limit') : limit

  return new Promise(async (resolve, reject) => {
    let token = await _getNextToken(skip, params)

    //a value of false means that we've run off the end of the data
    if (token == false) {
      resolve([])
    }

    let query = `select * from \`${sdb_domain}\``
    query += (typeof (limit) == 'number') ? ` limit ${limit}` : ''

    //if we are paging then set the NextToken
    let override = (token) ? { NextToken: token, } : {}

    sdb.select(query, override, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        let assets = []
        for (let r = 0; r < res.length; r++) {
          assets.push(_clean_sdb_asset(res[r]))
        }
        resolve(assets)
      }
    })
  })
}

/** Get (a single) asset by id
 * @param {Integer} skip the number of entries to skip (for a 300 response)
 * @param {Integer} limit the maximum number of queries to return (for a 300 response)
 * @param {String} asset_id and identifier that you would find in the identifiers array
 * @param {Simpledb_override_parameters} [params]
 * @returns {Array | Error} resolves to array of asset objects or  rejects with an error object
 */
const get_assets_by_id = async function (skip, limit, asset_id, params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise(async (resolve, reject) => {
    let query = `select * from \`${sdb_domain}\``
    query += ` where identifiers like '%"${asset_id}"%'`
    query += (typeof (limit) == 'number') ? ` limit ${limit}` : ''

    sdb.select(query, {}, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        let assets = []
        for (let r = 0; r < res.length; r++) {
          assets.push(_clean_sdb_asset(res[r]))
        }
        resolve(assets)
      }
    })
  })
}

/** Get (a single) asset by id
 * @param {String} asset_id and identifier that you would find in the identifiers array
 * @param {Simpledb_override_parameters} [params]
 * @returns {Array | Error} resolves to array of asset objects or  rejects with an error object
 */
const delete_assets_by_id = async function (asset_id, params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise(async (resolve, reject) => {
    //get an asset by id and then use its itemname to delete it
    let query = `select * from \`${sdb_domain}\``
    query += ` where identifiers like '%"${asset_id}"%'`
    query += (typeof (limit) == 'number') ? ` limit ${limit}` : ''

    sdb.select(query, {}, function (err, res, meta) {
      if (err || (res && (res.length < 1))) {
        //search error or nothing found - return 404
        resolve(404)
      } else if (res.length > 1) {
        //there were multiple matches so return them and give a 300 error from the API
        let assets = []
        for (let r = 0; r < res.length; r++) {
          assets.push(_clean_sdb_asset(res[r]))
        }
        resolve(assets)
      }
      else {
        //we got the item, so try and delete it
        let item_name = res[0].$ItemName
        sdb.deleteItem(sdb_domain, item_name, undefined, undefined, (err, res, meta) => {
          if (err) {
            //@todo should probably be a 500 error but return 404 becuase it's a demo
            reject(404)
          }
          //deletion succesful - return 204
          resolve(204)
        })
      }
    })
  })
}

/** Get total count of all records
 * @param {Integer} skip the number of entries to skip
 * @param {Integer} limit the maximum number of queries to return 
 * @param {Simpledb_override_parameters} [params]
 * @returns {Number} the number assets in the database
 * @todo handle big data:
 * Amazon SimpleDB returns a single item called Domain with a Count attribute.
 * If the count request takes more than five seconds, Amazon SimpleDB returns the number
 *    of items that it could count and a next token to return additional results.
 *    The client is responsible for accumulating the partial counts. 
 * If Amazon SimpleDB returns a 408 Request Timeout, please resubmit the request. 
 */
const total = async function (skip, limit, params) {
  let sdb_domain = _resolve_sdb_domain(params)

  return new Promise((resolve, reject) => {
    let query = `select count(*) from \`${sdb_domain}\``

    sdb.select(query, {}, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        resolve(parseInt(res[0].Count))
      }
    })
  })
}

//export the functions - they should all be asynchronous!
module.exports.delete_assets_by_id = delete_assets_by_id
module.exports.get = get
module.exports.get_assets_by_id = get_assets_by_id
module.exports.init = init
module.exports.info = info
module.exports.post = post
module.exports.reset = reset
module.exports.total = total