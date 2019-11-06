/** @module lib-validate-asset-api-record
 * 
 * validate a record that has been submitted via the API
 */

/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

/**
 * 
 * @param {koa_contect_object} ctx - the api object from koa
 * @returns {Boolean} application/json or application/xml specified
 */
let request_headers = (ctx) => {
    return ((ctx.request.header['content-type'] == 'application/json') || (ctx.request.header['content-type'] == 'application/xml'))
}

/** @todo - add extra testing here when authentication it turned on
 * 
 * @param {asset_registration_post_object} asset - asset sent via PUT or POST
 * @returns {Object} 
 * @property {number} status - the appropriate status code based on the values given
 * @property {string} help - an error message or success message for returning or discarding
 */
let json_values = (asset) => {
    let res = {
        status: 201,
        help: config.get('paths./assets.post.responses.201.content.application/json.example.status_label'),
    }
    return res
}

module.exports.request_headers = request_headers
module.exports.json_values = json_values