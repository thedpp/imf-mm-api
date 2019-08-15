/* jshint node: true */
'use strict'
/** @module database
 * 
 * Provide an adapter for different databases
 */

const config = require('config')

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

module.exports.init = db.init
module.exports.info = db.info
module.exports.post = db.post
module.exports.get = db.get
module.exports.reset = db.reset
