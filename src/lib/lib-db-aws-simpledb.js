/** @module AWS Simple database
 * 
 * it's dumb, it's not intended for production but it works
 * it might be slow and limited in the length of identifiers but hey, it's not for production.
 * 
 * AWS credentials are taken from Environment variables - see readme
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
 *  the AWS automatic mechanisms from the environment variables
*/
var aws_auto_config = new AWS.Config();

/**the structure of the configuration parameters for init() and reset()
 *
 * @typedef {Object} Simpledb_override_parameters
 * @property {String} simpledb_domain_name a domain name string of the database
 * 
 */



/* The preferred way to provide credentials is via the environment variables
 * If they are mising then don't initialise sdb and therefore nothing will
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
  sdb_domain =  (simpledb_domain_name) ? simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    sdb.createDomain(sdb_domain, function (err, res, meta) {
      if (err) {
        reject(err)
        initialised = 'failed'
      } else {
        resolve('ok')
        initialised = true
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
  var sdb_asset = JSON.parse(JSON.stringify(asset))

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
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

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

/** reset the database
 * 
 * @param {Simpledb_override_parameters} params 
 * @returns {String | Error} resolves to 'ok' or rejects with an error object
 */
const reset = async function (params) {
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    reject(new Error('Reset not implemented for SimpleDB'))
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
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

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


/** Add or update a record 
 * 
 * @param {Sdb_asset} asset
 * @param {Simpledb_override_parameters} [params]
 * @returns {String | Error} resolves to 'ok' or rejects with an error object
 *
 */
const post = async function (asset, params) {
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    /* @todo use one of the identifiers (hash?) as the canonical record */
    /* @todo search first to see if the identifier exists elsewhere */
    var item_name = asset.identifiers[0]

    asset.identifiers.forEach(element => {
      if (element.substr(0, 9) == "urn:sha1:") {
        item_name = element
      }
    });

    //prepare the asset for SimpleDB
    var sdb_asset = _prepare_sdb_asset(asset)

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
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    var query = `select * from \`${sdb_domain}\``
    query += (typeof (limit) == 'number') ? ` limit ${limit}` : ''

    sdb.select(query, {}, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        let assets = []
        for (var r = 0; r < res.length; r++) {
          assets.push(_clean_sdb_asset(res[r]))
        }
        resolve(assets)
      }
    })
  })
}

/** Get (a single) asset by id
 * @param {String} id and identifier that you would find in the identifiers array
 * @returns {Array} of asset objects
 */
const get_assets_by_id = async function (asset_id) {

  return new Promise(async (resolve, reject) => {
      //look inside the identifiers array for the asset_id
      let data = await db.get('assets')
          .find({ value: { identifiers: [asset_id,], }, })
          .value()
      if (data) {
          //check if an array of records or a single record was returned
          if (undefined == data.id) {
              //multiple records were returned
              let assets = []
              for (let d = 0; d < data.length; d++) {
                  assets.push(data[d].value)
              }
              resolve(assets)
          } else {
              //retun a single record in an array
              resolve([data.value,])
          }
      }
      resolve(undefined)
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
  let sdb_domain = `${config.get('database.simpledb_domain_name')}`
  sdb_domain =  (params && params.simpledb_domain_name) ? params.simpledb_domain_name : sdb_domain

  return new Promise((resolve, reject) => {
    var query = `select count(*) from \`${sdb_domain}\``

    sdb.select(query, {}, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        resolve(res.count)
      }
    })
  })
}

//export the functions - they should all be asynchronous!
module.exports.get = get
module.exports.get_assets_by_id = get_assets_by_id
module.exports.init = init
module.exports.info = info
module.exports.post = post
module.exports.reset = reset
module.exports.total = total