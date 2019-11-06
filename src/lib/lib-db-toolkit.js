/* jshint node: true */
'use strict'
/** @module dbtoolkit
 * 
 * some data mangling tools to format API results & db native results
 */

/** map a dbasset to the api format
 * 
 */

const _module = require('path').basename(__filename)

const _map_asset_TO_api_get_result = (asset) => {
    let result = {
        identifiers: asset.identifiers,
        file_size: asset.file_size,
        file_type: asset.file_type,
        locations: asset.locations,
    }
    return result
}

/** Convert an array of assets or a single asset to the API format
 * 
 */
module.exports.asset_TO_api_get_results = (asset) => {
    if (typeof (asset) !== 'object') {
        return {
            skip: 0,
            limit: 0,
            total: 0,
            results: [_map_asset_TO_api_get_result(asset),],
        }
    }

    let api_asset = []
    asset.forEach(element => {
        api_asset.push( _map_asset_TO_api_get_result(element) )
    })
    return {
        skip: 0,
        limit: 0,
        total: 0,
        results: api_asset,
    }
}

/** return the etag from a database asset
 * @param {Object} asset
 * @returns {String} etag string which may be empty if the database does not support it
 * @returns {undefined} if an array of more than one assets is given
 */
module.exports.asset_etag = (asset) => {
    //if database has returned a single element
    if ((asset) && (asset.length==1)) {
        return (asset[0].etag) ? asset[0].etag : ``
    }
    // we have an array of objects or something else
    return undefined
}