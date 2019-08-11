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

/* The simpledb library provides all the nice back-off functionality
 * but need to be given credentials manually. Let's extract them using
 * the AWS automatic mechanisms
*/
var aws_auto_config = new AWS.Config();
const sdb = new simpledb.SimpleDB({
  keyid: aws_auto_config.credentials.accessKeyId,
  secret: aws_auto_config.credentials.secretAccessKey,
}) //, simpledb.debuglogger)

//set the default domain name (i.e.table name) for simpledb
// e.g. imf-mm-api-server-js-production
let option = {}
option.domain_name = `${config.get('app_name')}-${process.env.NODE_ENV}`

log.info(`${rJ('aws sdb domain:')} ${option.domain_name}`)
log.info(`${rJ('aws sdb    key:')} ${aws_auto_config.credentials.accessKeyId}`)


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
      throw ('aws simple db failed to initialise')
  }
}

/** Create a domain to store records */
const _create_domain = async function (domain_name) {

  return new Promise((resolve, reject) => {
    sdb.createDomain(option.domain_name, function (err, res, meta) {
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
 * @param {Object} params 
 * @param {String} params.domain_name
 */
const init = async function (params) {
  initialised = 'pending'
  if (params && params.domain_name) {
    option.domain_name = params.domain_name
  }
  return _create_domain()
}

/** reset the database
 * 
 * @param {Object} params 
 * @param {String} params.domain_name
 */
const reset = async function (params) {
  return new Promise((resolve, reject) => {
    reject(new Error('Reset not implemented for SimpleDB'))
  })
}

/** return information about a domain (i.e. database name)
 * 
 */
const info = async function (params) {
  var domain_name = (undefined == params.domain_name) ? option.domain_name : params.domain_name

  return new Promise((resolve, reject) => {
    sdb.domainMetadata(domain_name, async function (err, res, meta) {
      if (err) {
        if (err.Code == "NoSuchDomain") {
          reject(`No such Database: ${option.domain_name}`)
        }
        reject(err)
      } else {
        resolve({
          db_type: 'aws simple db',
          db_name: domain_name,
          asset_count: res.ItemCount,
        })
      }
    })
  })
}


/** Add or update a record */
const post = async function (asset) {
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

    sdb.putItem(option.domain_name, item_name, sdb_asset, function (err, res, meta) {
      if (err) {
        reject(err)
      } else {
        resolve('ok')
      }
    })
  })
}

/** Get all records
 * @param {Integer} max_count the maximum number of queries to return 
 * @returns {Array} of asset objects
 */
const get = async function (max_count) {
  return new Promise((resolve, reject) => {
    var query = `select * from \`${option.domain_name}\``
    query += (typeof (max_count) == 'number') ? ` limit ${max_count}` : ''

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

//export the functions - they should all be asynchronous!
module.exports.init = init
module.exports.info = info
module.exports.post = post
module.exports.get = get
module.exports.reset = reset