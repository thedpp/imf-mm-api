/* jshint node: true */
'use strict'
/** @module database
 * 
 * Provide an adapter for different databases
 */

const config = require('config')
const u = require('./lib/util')
const _module = require('path').basename(__filename)

let db
let params = {}

switch (config.get('database').type) {
    default:
    case "local":
        db = require('./lib/lib-db-local')
        db.type = 'local'
        params.database_local_filename = config.get('database').local_filename
        break
    case "aws-simple-db":
        db = require('./lib/lib-db-aws-simpledb')
        db.type = 'aws-simple-db'
        params.domain = config.get('database').simpledb_domain_name
}

// export each method manually to help auto-complete
// functions in IDE editors

module.exports.delete_assets_by_id = db.delete_assets_by_id
module.exports.get_assets = db.get_assets
module.exports.get_assets_by_id = db.get_assets_by_id
module.exports.info = db.info
module.exports.init = db.init
module.exports.post = db.post
module.exports.reset = db.reset
module.exports.total = db.total
