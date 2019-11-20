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
const _module = require('path').basename(__filename)

//the name of the local file to store the database is in config
let adapter, db, db_filename



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

/** POST a new record or replace an existing one
 * @param {Object} asset - an asset api object
 * @return {String} 'ok' on success
 * 
 * NOTE It is the responsibility of the database to generate the etag value
 * 
 * @todo improve return status to be an object with http code and message
 * @todo explore db post failure mechanisms
 */
const post = async function (asset) {
    return new Promise((resolve, reject) => {
        /* @todo use one of the identifiers (hash?) as the canonical record */
        /* @todo search first to see if the identifier exists elsewhere */
        let item_name = asset.identifiers[0]

        //simplest eTag for collision detection is a millisecond timestamp as a hex string
        asset.etag = new Date().getTime().toString(16)

        asset.identifiers.forEach(element => {
            if (element.substr(0, 9) == "urn:sha1:") {
                item_name = element
            }
        });

        let exists = db.get('assets')
            .find({ id: item_name, })
            .value()

        if (exists) {
            db.get('assets')
                .find({ id: item_name, })
                .assign({ value: asset, })
                .write()
            resolve('ok')
        } else {
            db.get('assets')
                .push({ id: item_name, value: asset, })
                .write()
            resolve('ok')
        }
    })
}

/** Get all records
 * @param {Integer} skip the number of queries to skip
 * @param {Integer} limit the maximum number of queries to return 
 * @returns {Array} of asset objects
 */
const get_assets = async function (skip, limit, file_types) {
    skip = (undefined == skip) ? 0 : skip
    limit = (undefined == limit) ? config.get('default_get_limit') : limit

    return new Promise((resolve, reject) => {
        let assets = db.get('assets')

        if(file_types) {
            assets =
                assets
                .filter(function(item) {
                    return file_types.includes(item.value.file_type);
                })
        }

        assets = assets
            .slice(skip, skip + limit)
            .value()
            .map(asset => asset.value)

        resolve(assets)
    })
}

/** Get (a single) asset by id
 * @param {String} id and identifier that you would find in the identifiers array
 * @returns {Array} of asset objects
 */
const get_assets_by_id = async function (skip, limit, asset_id) {
    return new Promise(async (resolve, reject) => {
        //look inside the identifiers array for the asset_id
        let data = await db.get('assets')
            .filter(function(item) {
                return item.value.identifiers.includes(asset_id);
            })
            .value()
            .map(asset => asset.value)

        if (!data) {
            return resolve(undefined)
        }

        //check if an array of records or a single record was returned
        if (!data.id) {
            //multiple records were returned
            return resolve(data)
        }

        //retun a single record in an array
        resolve([data])
    })
}

/** Delete assets by id
 * @param {String} id an identifier that you would find in the identifiers array
 * @returns {Array} of asset objects
 */
const delete_assets_by_id = async function (asset_id) {

    return new Promise(async (resolve, reject) => {
        //look inside the identifiers array for the asset_id
        let data = await db.get('assets')
            .find({ value: { identifiers: [asset_id,], }, })
            .write()
        //check if an array of records or a single record was returned
        if (data) {
            //check if an array of records or a single record was returned
            if (undefined == data.id) {
                //return the matching records
                let assets = []
                for (let d = 0; d < data.length; d++) {
                    assets.push(data[d].value)
                }
                resolve(assets)
            } else {
                // a single entry was found - return the 204 code
                data = await db.get('assets')
                    .remove({ value: { identifiers: [asset_id,], }, })
                    .write()
                resolve(204)
            }
        } else {
            //nothing found - return 404
            resolve(404)
        }
    })
}

/** Get total count of all records
 * @returns {Number} the number assets in the database
 */
const total = async function (skip, limit) {
    return new Promise((resolve, reject) => {
        resolve(db.get('assets').value().length)
    })
}

//export the functions
module.exports.delete_assets_by_id = delete_assets_by_id
module.exports.get_assets = get_assets
module.exports.get_assets_by_id = get_assets_by_id
module.exports.init = init
module.exports.info = info
module.exports.reset = reset
module.exports.post = post
module.exports.total = total
