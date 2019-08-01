/* jshint node: true */
'use strict'
/** @module dbtoolkit
 * 
 * some data mangling tools to format API results & db native results
 */

/** map a dbasset to the api format
 * 
 */


const _map_asset_TO_api_get_result = function(asset) {
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
module.exports.asset_TO_api_get_results = function (asset) {
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