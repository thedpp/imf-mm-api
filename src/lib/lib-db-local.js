/** @module local database
 * 
 * it's dumb, it's not intended for production but it works
 * it WILL have problems if db.json gets bigger thatn 100MB
  */
/* jshint node: true */
'use strict'
const fs = require('fs')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const config = require('config')

//the name of the local file to store the database is in config
let adapter, db, db_filename

const get_asset = function (asset_id) {
    var record = db.get('assets')
        .find({ id: asset_id, })
        .value()

    if (undefined == record) {
        return db.get('assets')
            .find({ manifest: asset_id, })
            .value()
    }
    return record
}

/** Extract filename from parameters
 *   if no filename specified then use config
 */
const __get_db_filename = function (params) {
    return (params && params.local_filename) ? params.local_filename : config.get('database').local_filename
}

/** intialise the database
 * 
 * @param {Object} params 
 * @param {String} params.domain_name
 */
const init = async function (params) {
    db_filename = __get_db_filename(params)

    return new Promise((resolve, reject) => {
        adapter = new FileSync(db_filename)
        db = low(adapter)

        // read from the database to make the file
        db.read()

        //create 2 sub-tables in the database for assets and for request logging
        db.defaults({ assets: [], requests: [], })
            .write()

        resolve('ok')
    })
}

/** return information about a database (i.e. database name)
 * 
 */
const info = async function (params) {
    let info_filename = __get_db_filename(params)

    return new Promise((resolve, reject) => {
        try {
            const info_adapter = new FileSync(info_filename)
            const info_db = low(info_adapter)
            let asset_count = info_db.get('assets')
                .size()
                .value()
            resolve({
                db_type: 'local db (lowdb)',
                db_name: db_filename,
                asset_count: asset_count,
            })
        } catch (err) {
            reject(err)
        }
    })
}

/** reset the current database deleting all the assets in it
 * 
 */
const reset = async function (params) {
    let db_filename = __get_db_filename(params)

    return new Promise(async (resolve, reject) => {
        try {
            fs.unlinkSync(db_filename)
            await init(params)
            resolve('ok')
        } catch (err) {
            reject(err)
        }
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

        var exists = db.get('assets')
            .find({ id: item_name, })
            .value()

        if (exists) {
            db.get('assets')
                .find({ id: item_name, })
                .assign({ value: asset, })
                .write()
                .then(resolve('ok'))
                .catch(err => reject(err))
        } else {
            db.get('assets')
                .push({ id: item_name, value: asset, })
                .write()
                .then(resolve('ok'))
                .catch(err => reject(err))
        }

    })
}

/** Get all records
 * @param {Integer} skip the number of queries to skip
 * @param {Integer} limit the maximum number of queries to return 
 * @returns {Array} of asset objects
 */
const get = async function (skip, limit) {
    return new Promise((resolve, reject) => {
        var data = db.get('assets')
            .slice(skip, skip + limit)
            .value()

        let assets = []
        for (var d = 0; d < data.length; d++) {
            assets.push(data[d].value)
        }
        resolve(assets)
    })
}

//export the functions
module.exports.init = init
module.exports.info = info
module.exports.post = post
module.exports.get = get
module.exports.reset = reset